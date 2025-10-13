import { userSession } from '~/models';
import { syncOrganizations } from '~/ui/organization-utils';
import { createFetcherSubmitHook } from '~/utils/router';

import type { Route } from './+types/organization.sync';

export async function clientAction(_args: Route.ClientActionArgs) {
  const { id: sessionId } = await userSession.getOrCreate();

  if (sessionId) {
    await syncOrganizations(sessionId);
  }

  return null;
}

export const useOrganizationSyncActionFetcher = createFetcherSubmitHook(
  submit => () => {
    return submit(
      {},
      {
        method: 'POST',
        action: '/organization/sync',
      },
    );
  },
  clientAction,
);
