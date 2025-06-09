# AstraOps CLI - Arquitectura Modular

## Estructura del Proyecto

La aplicación ha sido modularizada en los siguientes componentes:

### `types.ts`
Define todas las interfaces TypeScript utilizadas en el proyecto:
- `AWSConfig`: Configuración de AWS
- `AstraOpsConfig`: Configuración de AstraOps API
- `ServicePrincipalCredentials`: Credenciales del service principal
- `AstraOpsRegistrationPayload`: Payload para registro con AstraOps
- Otros tipos de datos

### `config.ts`
Maneja la validación y configuración de variables de entorno:
- `validateAndGetConfig()`: Valida que todas las variables requeridas estén presentes

### `aws-clients.ts`
Configura y maneja los clientes AWS:
- `createAWSClients()`: Crea instancias de IAM y STS clients
- `getAWSAccountId()`: Obtiene el Account ID usando STS

### `iam-service.ts`
Servicio para todas las operaciones de IAM:
- `IAMService.createServicePrincipal()`: Crea usuario service principal con políticas
- `IAMService.createManagedPolicy()`: Crea políticas administradas
- `IAMService.createExecutionRole()`: Crea roles de ejecución
- `IAMService.attachPolicyToRole()`: Adjunta políticas a roles
- `IAMService.getManagedPolicyDocument()`: Genera documento de política

### `astraops-service.ts`
Servicio para integración con AstraOps API:
- `AstraOpsService.registerRole()`: Registra rol con la API de AstraOps

### `logger.ts`
Maneja el streaming de logs en tiempo real:
- `LogStreamer.streamLogs()`: Conecta via SSE para recibir logs del setup

### `main.ts`
Orquesta todo el flujo del setup:
- `main()`: Función principal que coordina todos los pasos

### `index.ts` (src/)
Exporta todas las funciones y clases públicas para uso externo.

## Uso

```typescript
import { main } from './src/main.js';

// Ejecutar el setup completo
await main();
```

O usar componentes individuales:

```typescript
import { IAMService, createAWSClients } from './src/index.js';

const { iam } = createAWSClients(config);
const iamService = new IAMService(iam);
```

## Beneficios de la Modularización

1. **Separación de responsabilidades**: Cada módulo tiene una función específica
2. **Reutilización**: Los servicios pueden ser utilizados independientemente
3. **Testabilidad**: Fácil testing unitario de cada módulo
4. **Mantenibilidad**: Código más organizado y fácil de entender
5. **Escalabilidad**: Fácil agregar nuevas funcionalidades sin afectar módulos existentes

## ⚠️ Note on Executable Permissions (GitHub Releases)

If you download the CLI binary directly from the [GitHub Releases](https://github.com/AstraOpsOrg/AstraCLI/releases) page (for Linux or macOS), please note:

- **The downloaded file will NOT have executable permissions by default.**
- Before running the CLI, you must grant execution permissions:

```bash
chmod +x astraops-cli-linux   # or astraops-cli-macos
./astraops-cli-linux          # or ./astraops-cli-macos
```

- This is a security feature of GitHub. Windows users do not need to do anything extra.

If you install the CLI via npm and the postinstall script, permissions will be set automatically. 