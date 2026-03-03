import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '@andikisha/database';
import {
  AddBankAccountRequest,
  UpdateBankAccountRequest,
  SetPrimaryBankAccountRequest,
} from '../../proto/employee.pb';
import { BankAccount, Prisma } from '@prisma/client';

@Injectable()
export class BankAccountService {
  private readonly logger = new Logger(BankAccountService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Add bank account
   */
  async addBankAccount(request: AddBankAccountRequest): Promise<BankAccount> {
    this.logger.log(`Adding bank account for employee: ${request.employee_id}`);

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

    // If this is marked as primary, unset other primary accounts
    if (request.is_primary) {
      await this.prisma.bankAccount.updateMany({
        where: {
          employeeId: request.employee_id!,
        },
        data: {
          isPrimary: false,
        },
      });
    }

    try {
      const accountData: Prisma.BankAccountCreateInput = {
        employee: {
          connect: { id: request.employee_id! },
        },
        bankName: request.bank_name!,
        branchName: request.branch_name || undefined,
        accountNumber: request.account_number!,
        accountName: request.account_name!,
        swiftCode: request.swift_code || undefined,
        currency: request.currency || 'KES',
        isPrimary: request.is_primary || false,
      };

      return await this.prisma.bankAccount.create({
        data: accountData,
      });
    } catch (error) {
      this.logger.error(`Failed to add bank account: ${error.message}`, error.stack);
      throw new RpcException({
        code: 13, // INTERNAL
        message: 'Failed to add bank account',
      });
    }
  }

  /**
   * Update bank account
   */
  async updateBankAccount(request: UpdateBankAccountRequest): Promise<BankAccount> {
    this.logger.log(`Updating bank account: ${request.id}`);

    // Verify account exists
    const existing = await this.prisma.bankAccount.findFirst({
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
        message: `Bank account with ID ${request.id} not found`,
      });
    }

    // Verify tenant matches
    if (existing.employee.tenantId !== request.tenant_id) {
      throw new RpcException({
        code: 7, // PERMISSION_DENIED
        message: 'Tenant mismatch',
      });
    }

    try {
      const updateData: Prisma.BankAccountUpdateInput = {};

      if (request.bank_name) updateData.bankName = request.bank_name;
      if (request.branch_name !== undefined) updateData.branchName = request.branch_name;
      if (request.account_number) updateData.accountNumber = request.account_number;
      if (request.account_name) updateData.accountName = request.account_name;
      if (request.swift_code !== undefined) updateData.swiftCode = request.swift_code;
      if (request.currency) updateData.currency = request.currency;

      return await this.prisma.bankAccount.update({
        where: {
          id: request.id!,
        },
        data: updateData,
      });
    } catch (error) {
      this.logger.error(`Failed to update bank account: ${error.message}`, error.stack);
      throw new RpcException({
        code: 13, // INTERNAL
        message: 'Failed to update bank account',
      });
    }
  }

  /**
   * Delete bank account
   */
  async deleteBankAccount(id: string, employeeId: string, tenantId: string): Promise<void> {
    this.logger.log(`Deleting bank account: ${id}`);

    // Verify account exists
    const account = await this.prisma.bankAccount.findFirst({
      where: {
        id,
        employeeId,
      },
      include: {
        employee: true,
      },
    });

    if (!account) {
      throw new RpcException({
        code: 5, // NOT_FOUND
        message: `Bank account with ID ${id} not found`,
      });
    }

    // Verify tenant matches
    if (account.employee.tenantId !== tenantId) {
      throw new RpcException({
        code: 7, // PERMISSION_DENIED
        message: 'Tenant mismatch',
      });
    }

    await this.prisma.bankAccount.delete({
      where: {
        id,
      },
    });
  }

  /**
   * Set primary bank account
   */
  async setPrimaryBankAccount(request: SetPrimaryBankAccountRequest): Promise<BankAccount> {
    this.logger.log(`Setting primary bank account: ${request.id}`);

    // Verify account exists
    const account = await this.prisma.bankAccount.findFirst({
      where: {
        id: request.id!,
        employeeId: request.employee_id!,
      },
      include: {
        employee: true,
      },
    });

    if (!account) {
      throw new RpcException({
        code: 5, // NOT_FOUND
        message: `Bank account with ID ${request.id} not found`,
      });
    }

    // Verify tenant matches
    if (account.employee.tenantId !== request.tenant_id) {
      throw new RpcException({
        code: 7, // PERMISSION_DENIED
        message: 'Tenant mismatch',
      });
    }

    // Unset all primary accounts for this employee
    await this.prisma.bankAccount.updateMany({
      where: {
        employeeId: request.employee_id!,
      },
      data: {
        isPrimary: false,
      },
    });

    // Set this account as primary
    return await this.prisma.bankAccount.update({
      where: {
        id: request.id!,
      },
      data: {
        isPrimary: true,
      },
    });
  }
}
