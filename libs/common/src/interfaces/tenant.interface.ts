export interface Tenant {
    id: string;
    name: string;
    slug: string;
    status: TenantStatus;
    subscriptionPlan: SubscriptionPlan;
    settings: TenantSettings;
}

export enum TenantStatus {
    ACTIVE = 'ACTIVE',
    SUSPENDED = 'SUSPENDED',
    TRIAL = 'TRIAL',
    CANCELLED = 'CANCELLED',
    INACTIVE = 'INACTIVE',
}

export enum SubscriptionPlan {
    STARTER = 'STARTER',    // 1-10 employees
    GROWTH = 'GROWTH',      // 11-50 employees
    PROFESSIONAL = 'PROFESSIONAL', // 51-200 employees
    ENTERPRISE = 'ENTERPRISE',     // 200+ employees
    UNLIMITED = 'UNLIMITED', // Unlimited employees
}

export interface TenantSettings {
    currency: string;
    timezone: string;
    language: string;
    dateFormat: string;
    fiscalYearStart: string; // MM-DD
}