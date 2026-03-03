export class EmployeeCreatedEvent {
    constructor(
        public readonly employeeId: string,
        public readonly tenantId: string,
        public readonly firstName: string,
        public readonly lastName: string,
        public readonly email: string,
        public readonly departmentId: string,
        public readonly positionId: string,
        public readonly hireDate: Date,
    ) {}
}

export class EmployeeUpdatedEvent {
    constructor(
        public readonly employeeId: string,
        public readonly tenantId: string,
        public readonly changes: Record<string, any>,
    ) {}
}

export class EmployeeTerminatedEvent {
    constructor(
        public readonly employeeId: string,
        public readonly tenantId: string,
        public readonly terminationDate: Date,
        public readonly reason: string,
    ) {}
}