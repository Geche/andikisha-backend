import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '@andikisha/database';
import {
  AddEmergencyContactRequest,
  UpdateEmergencyContactRequest,
} from '../../proto/employee.pb';
import { EmergencyContact, Prisma } from '@prisma/client';

@Injectable()
export class EmergencyContactService {
  private readonly logger = new Logger(EmergencyContactService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Add emergency contact
   */
  async addEmergencyContact(request: AddEmergencyContactRequest): Promise<EmergencyContact> {
    this.logger.log(`Adding emergency contact for employee: ${request.employee_id}`);

    // Verify employee exists
    const employee = await this.prisma.employee.findFirst({
      where: {
        id: request.employee_id!,
        tenantId: request.tenant_id!,
      },
    });

    if (!employee) {
      throw new RpcException({
        code: 5, // NOT_FOUND
        message: `Employee with ID ${request.employee_id} not found`,
      });
    }

    // If this is marked as primary, unset other primary contacts
    if (request.is_primary) {
      await this.prisma.emergencyContact.updateMany({
        where: {
          employeeId: request.employee_id!,
        },
        data: {
          isPrimary: false,
        },
      });
    }

    try {
      const contactData: Prisma.EmergencyContactCreateInput = {
        employee: {
          connect: { id: request.employee_id! },
        },
        fullName: request.full_name!,
        relationship: request.relationship!,
        phoneNumber: request.phone_number!,
        alternatePhone: request.alternate_phone || undefined,
        email: request.email || undefined,
        address: request.address || undefined,
        isPrimary: request.is_primary || false,
      };

      return await this.prisma.emergencyContact.create({
        data: contactData,
      });
    } catch (error) {
      this.logger.error(`Failed to add emergency contact: ${error.message}`, error.stack);
      throw new RpcException({
        code: 13, // INTERNAL
        message: 'Failed to add emergency contact',
      });
    }
  }

  /**
   * Update emergency contact
   */
  async updateEmergencyContact(
    request: UpdateEmergencyContactRequest,
  ): Promise<EmergencyContact> {
    this.logger.log(`Updating emergency contact: ${request.id}`);

    // Verify contact exists
    const existing = await this.prisma.emergencyContact.findFirst({
      where: {
        id: request.id!,
        employeeId: request.employee_id!,
      },
      include: {
        employee: true,
      },
    });

    if (!existing) {
      throw new RpcException({
        code: 5, // NOT_FOUND
        message: `Emergency contact with ID ${request.id} not found`,
      });
    }

    // Verify tenant matches
    if (existing.employee.tenantId !== request.tenant_id) {
      throw new RpcException({
        code: 7, // PERMISSION_DENIED
        message: 'Tenant mismatch',
      });
    }

    // If setting as primary, unset other primary contacts
    if (request.is_primary) {
      await this.prisma.emergencyContact.updateMany({
        where: {
          employeeId: request.employee_id!,
          id: { not: request.id! },
        },
        data: {
          isPrimary: false,
        },
      });
    }

    try {
      const updateData: Prisma.EmergencyContactUpdateInput = {};

      if (request.full_name) updateData.fullName = request.full_name;
      if (request.relationship) updateData.relationship = request.relationship;
      if (request.phone_number) updateData.phoneNumber = request.phone_number;
      if (request.alternate_phone !== undefined)
        updateData.alternatePhone = request.alternate_phone;
      if (request.email !== undefined) updateData.email = request.email;
      if (request.address !== undefined) updateData.address = request.address;
      if (request.is_primary !== undefined) updateData.isPrimary = request.is_primary;

      return await this.prisma.emergencyContact.update({
        where: {
          id: request.id!,
        },
        data: updateData,
      });
    } catch (error) {
      this.logger.error(`Failed to update emergency contact: ${error.message}`, error.stack);
      throw new RpcException({
        code: 13, // INTERNAL
        message: 'Failed to update emergency contact',
      });
    }
  }

  /**
   * Delete emergency contact
   */
  async deleteEmergencyContact(
    id: string,
    employeeId: string,
    tenantId: string,
  ): Promise<void> {
    this.logger.log(`Deleting emergency contact: ${id}`);

    // Verify contact exists
    const contact = await this.prisma.emergencyContact.findFirst({
      where: {
        id,
        employeeId,
      },
      include: {
        employee: true,
      },
    });

    if (!contact) {
      throw new RpcException({
        code: 5, // NOT_FOUND
        message: `Emergency contact with ID ${id} not found`,
      });
    }

    // Verify tenant matches
    if (contact.employee.tenantId !== tenantId) {
      throw new RpcException({
        code: 7, // PERMISSION_DENIED
        message: 'Tenant mismatch',
      });
    }

    await this.prisma.emergencyContact.delete({
      where: {
        id,
      },
    });
  }
}
