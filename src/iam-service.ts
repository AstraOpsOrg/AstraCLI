import { 
    IAMClient, 
    CreateUserCommand, 
    CreatePolicyCommand, 
    AttachUserPolicyCommand, 
    CreateAccessKeyCommand, 
    CreateRoleCommand, 
    AttachRolePolicyCommand 
} from "@aws-sdk/client-iam";
import type { ServicePrincipalResult, IAMResourceResult } from '@/src/types.ts';
import type { Logger } from '@/src/utils/logger.ts';

export class IAMService {
    constructor(private iamClient: IAMClient, private logger?: Logger) {}

    async createServicePrincipal(
        userName: string, 
        executionRoleName: string, 
        accountId: string
    ): Promise<ServicePrincipalResult> {
        try {
            // 1. Crear Usuario
            const createUserResponse = await this.iamClient.send(new CreateUserCommand({ UserName: userName }));
            const servicePrincipalArn = createUserResponse.User?.Arn || '';
            if (!servicePrincipalArn) throw new Error("Failed to create service principal user or get its ARN.");
            
            if (this.logger) {
                this.logger.success(`Service Principal User created: ${servicePrincipalArn}`);
            } else {
                console.log(`Service Principal User created: ${servicePrincipalArn}`);
            }

            // 2. Crear Política para el Usuario (sts:AssumeRole sobre el futuro rol de ejecución)
            const policyForServicePrincipalDoc = JSON.stringify({
                Version: "2012-10-17",
                Statement: [{
                    Effect: "Allow",
                    Action: "sts:AssumeRole",
                    Resource: `arn:aws:iam::${accountId}:role/${executionRoleName}`
                }]
            });
            const servicePrincipalPolicyName = "AstraOpsApiServicePrincipalPolicy";
            const createServicePrincipalPolicy = await this.iamClient.send(new CreatePolicyCommand({
                PolicyName: servicePrincipalPolicyName,
                PolicyDocument: policyForServicePrincipalDoc,
                Description: "Policy for AstraOps Service Principal to assume the execution role."
            }));
            const servicePrincipalPolicyArn = createServicePrincipalPolicy.Policy?.Arn;
            if (!servicePrincipalPolicyArn) throw new Error("Failed to create policy for service principal.");
            
            if (this.logger) {
                this.logger.success(`Policy for Service Principal User created: ${servicePrincipalPolicyArn}`);
            } else {
                console.log(`Policy for Service Principal User created: ${servicePrincipalPolicyArn}`);
            }
            
            // 3. Adjuntar Política al Usuario
            await this.iamClient.send(new AttachUserPolicyCommand({
                UserName: userName,
                PolicyArn: servicePrincipalPolicyArn
            }));
            if (this.logger) {
                this.logger.success(`Policy attached to Service Principal User`);
            } else {
                console.log(`Policy attached to Service Principal User.`);
            }

            // 4. Crear Claves de Acceso para el Usuario
            const accessKeyResponse = await this.iamClient.send(new CreateAccessKeyCommand({ UserName: userName }));
            if (!accessKeyResponse.AccessKey?.AccessKeyId || !accessKeyResponse.AccessKey?.SecretAccessKey) {
                throw new Error("Failed to create access keys for service principal user.");
            }
            const accessKeyId = accessKeyResponse.AccessKey.AccessKeyId;
            const secretAccessKey = accessKeyResponse.AccessKey.SecretAccessKey;
            if (this.logger) {
                this.logger.success(`Access Keys created for Service Principal User`);
            } else {
                console.log(`Access Keys created for Service Principal User.`);
            }

            return {
                arn: servicePrincipalArn,
                accessKeyId,
                secretAccessKey
            };

        } catch (error) {
            if (this.logger) {
                this.logger.error(`Error creating AstraOps Service Principal User or its resources: ${error}`);
            } else {
                console.error("Error creating AstraOps Service Principal User or its resources:", error);
            }
            // Aquí podrías añadir lógica para limpiar recursos creados parcialmente si falla
            process.exit(1);
        }
    }

    async createManagedPolicy(policyName: string, policyDocument: string): Promise<IAMResourceResult> {
        try {
            const createManagedPolicy = await this.iamClient.send(new CreatePolicyCommand({
                PolicyName: policyName,
                PolicyDocument: policyDocument,
                Description: "Managed policy for AstraOps to operate EKS and related services."
            }));
            const managedPolicyArn = createManagedPolicy.Policy?.Arn || '';
            if (!managedPolicyArn) throw new Error(`Failed to create ${policyName}.`);
            
            if (this.logger) {
                this.logger.success(`${policyName} created: ${managedPolicyArn}`);
            } else {
                console.log(`${policyName} created: ${managedPolicyArn}`);
            }
            return { arn: managedPolicyArn };
        } catch (error) {
            if (this.logger) {
                this.logger.error(`Error creating ${policyName}: ${error}`);
            } else {
                console.error(`Error creating ${policyName}:`, error);
            }
            process.exit(1);
        }
    }

    async createExecutionRole(
        roleName: string, 
        servicePrincipalArn: string
    ): Promise<IAMResourceResult> {
        try {
            // Política de Confianza: permite que el servicePrincipalArn asuma este rol
            const assumeRolePolicyDoc = JSON.stringify({
                Version: "2012-10-17",
                Statement: [{
                    Effect: "Allow",
                    Principal: { AWS: servicePrincipalArn },
                    Action: "sts:AssumeRole"
                }]
            });

            const createRole = await this.iamClient.send(new CreateRoleCommand({
                RoleName: roleName,
                AssumeRolePolicyDocument: assumeRolePolicyDoc,
                Description: "Role to be assumed by AstraOps API for managing resources."
            }));
            const roleArn = createRole.Role?.Arn || '';
            if (!roleArn) throw new Error(`Failed to create ${roleName}.`);
            
            if (this.logger) {
                this.logger.success(`${roleName} created: ${roleArn}`);
            } else {
                console.log(`${roleName} created: ${roleArn}`);
            }
            return { arn: roleArn };
        } catch (error) {
            if (this.logger) {
                this.logger.error(`Error creating ${roleName}: ${error}`);
            } else {
                console.error(`Error creating ${roleName}:`, error);
            }
            process.exit(1);
        }
    }

    async attachPolicyToRole(roleName: string, policyArn: string): Promise<void> {
        try {
            await this.iamClient.send(new AttachRolePolicyCommand({
                RoleName: roleName,
                PolicyArn: policyArn 
            }));
            if (this.logger) {
                this.logger.success(`Policy ${policyArn} attached to role ${roleName}`);
            } else {
                console.log(`Policy ${policyArn} attached to role ${roleName}.`);
            }
        } catch (error) {
            if (this.logger) {
                this.logger.error(`Error attaching policy to execution role: ${error}`);
            } else {
                console.error("Error attaching policy to execution role:", error);
            }
            process.exit(1);
        }
    }

    getManagedPolicyDocument(): string {
        // Aquí deberías definir el JSON de la política con permisos para EKS, ECR, S3, etc.
        // Por ahora retorno un objeto vacío como placeholder
        return JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                // Aquí van los permisos específicos para EKS, ECR, S3, etc.
                // Este es un placeholder - debes completar con los permisos reales necesarios
                {
                    Effect: "Allow",
                    Action: [
                        "eks:*",
                        "ecr:*",
                        "s3:*"
                    ],
                    Resource: "*"
                }
            ]
        });
    }
} 