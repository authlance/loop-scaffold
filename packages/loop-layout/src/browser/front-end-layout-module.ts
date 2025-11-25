import { ContainerModule } from 'inversify'
import { FrontendLayoutApplication } from './front-end-layout-application'
import { FrontendApplicationContribution } from '@authlance/core/lib/browser/frontend-contribution'
import { DashboardContentProvider } from '@authlance/core/lib/browser/common/ui-contributions'
import { DashboardContentProviderImpl } from './hooks/useDashboardContent'

export default new ContainerModule((bind) => {
    bind(FrontendLayoutApplication).toSelf().inSingletonScope()
    bind(FrontendApplicationContribution).toDynamicValue((ctx) => {
        const result = ctx.container.get(FrontendLayoutApplication)
        return result
    })

    bind(DashboardContentProviderImpl).toSelf().inSingletonScope()
    bind(DashboardContentProvider).toService(DashboardContentProviderImpl)
})
