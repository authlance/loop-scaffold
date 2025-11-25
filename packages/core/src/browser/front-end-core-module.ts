import { ContainerModule } from 'inversify'
import { RoutesApplicationContribution } from '@authlance/core/lib/common/routes/routes'
import { DefaultDashboardContentContributor } from '@authlance/core/lib/browser/common/ui-contributions'
import { HomeContentContribution } from './contributions/home-content-contribution'
import { HomePageContribution } from './pages/IndexPage'


export default new ContainerModule((bind) => {
    bind(HomeContentContribution).toSelf()
    bind(DefaultDashboardContentContributor).toService(HomeContentContribution)
    bind(HomePageContribution).toSelf()
    bind(RoutesApplicationContribution).toService(HomePageContribution)
})
