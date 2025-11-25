import { ContainerModule } from 'inversify'
import { CoreBackendApplication } from './core-application'

export default new ContainerModule((bind) => {
    bind(CoreBackendApplication).toSelf().inSingletonScope()
})
