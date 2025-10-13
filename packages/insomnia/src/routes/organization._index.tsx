import { href, redirect } from 'react-router';

import * as session from '~/account/session';
import { userSession } from '~/models';
import { type Organization } from '~/models/organization';
import { syncOrganizations } from '~/ui/organization-utils';
import { invariant } from '~/utils/invariant';

import type { Route } from './+types/organization._index';

export async function clientLoader(_args: Route.ClientLoaderArgs) {
  const { id } = await userSession.getOrCreate();
  if (id) {
    await syncOrganizations(id);

    const organizations = JSON.parse(localStorage.getItem(`${id}:organizations`) || '[]') as Organization[];
    invariant(organizations, 'Failed to fetch organizations.');

    const specificOrgRedirectAfterAuthorize = window.localStorage.getItem('specificOrgRedirectAfterAuthorize');
    if (specificOrgRedirectAfterAuthorize && specificOrgRedirectAfterAuthorize !== '') {
      window.localStorage.removeItem('specificOrgRedirectAfterAuthorize');
      return redirect(`/organization/${specificOrgRedirectAfterAuthorize}`);
    }

    if (organizations.length > 0) {
      return redirect(`/organization/${organizations[0].id}`);
    }
  }

  await session.logout();
  return redirect(href('/auth/login'));
}
