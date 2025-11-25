import React from 'react'
import { injectable } from 'inversify'
import { DefaultDashboardContentContributor } from '@authlance/core/lib/browser/common/ui-contributions'
import { AuthSession } from '@authlance/core/lib/browser/hooks/useAuth'
import { RoutePrerenderContext, RoutePrerenderDocumentDefinition, RoutePrerenderDocumentProvider } from '@authlance/core/lib/common/routes/routes'
import { HomeComponent } from '../components/home-components'

@injectable()
export class HomeContentContribution implements DefaultDashboardContentContributor {
    getContent(authContext: AuthSession): React.ReactElement {
        return <HomeComponent />
    }

    getDocumentProvider(): RoutePrerenderDocumentProvider {
        return (_context: RoutePrerenderContext) => {
            const document: RoutePrerenderDocumentDefinition = {
                title: 'Loop Scaffold — Authlance',
                meta: [
                    {
                        attributes: {
                            name: 'description',
                            content:
                                'Loop Scaffold is a framework for building scalable and maintainable applications.',
                        },
                    },
                    {
                        attributes: {
                            name: 'keywords',
                            content: 'Loop Scaffold, Authlance, framework, scalable, maintainable',
                        },
                    },
                ],
            }
            return Promise.resolve(document)
        }
    }

    getWeight(): number {
        return 100
    }
}
