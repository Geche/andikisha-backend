import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// Extend Express Request type to include tenant information
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      tenant?: {
        id: string;
        subdomain?: string;
      };
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Strategy 1: Extract tenant from X-Tenant-ID header (primary method)
    const headerTenantId = req.headers['x-tenant-id'] as string;

    // Strategy 2: Extract tenant from subdomain (optional)
    // Example: tenant1.andikishaHR.com -> tenant1
    const host = req.headers.host || '';
    const subdomain = this.extractSubdomain(host);

    // Strategy 3: Extract tenant from path parameter (optional)
    // Example: /api/v1/tenants/:tenantId/...
    const pathTenantId = req.params?.tenantId;

    // Determine tenant ID (header takes priority)
    const tenantId = headerTenantId || pathTenantId || subdomain;

    if (!tenantId) {
      // Skip tenant validation for auth routes (registration, login)
      const isAuthRoute = req.path.startsWith('/api/auth/register') ||
                          req.path.startsWith('/api/auth/login') ||
                          req.path === '/api/docs' ||
                          req.path.startsWith('/api/docs');

      if (!isAuthRoute) {
        throw new BadRequestException(
          'Tenant ID is required. Please provide X-Tenant-ID header.',
        );
      }
    }

    // Attach tenant information to request object
    if (tenantId) {
      req.tenantId = tenantId;
      req.tenant = {
        id: tenantId,
        subdomain: subdomain || undefined,
      };
    }

    next();
  }

  /**
   * Extract subdomain from host
   * @param host - The host header value
   * @returns Subdomain or null
   */
  private extractSubdomain(host: string): string | null {
    // Remove port if present
    const hostname = host.split(':')[0];

    // Split by dots
    const parts = hostname.split('.');

    // If we have at least 3 parts (subdomain.domain.tld), extract subdomain
    // Example: tenant1.andikishaHR.com -> tenant1
    if (parts.length >= 3) {
      return parts[0];
    }

    return null;
  }
}
