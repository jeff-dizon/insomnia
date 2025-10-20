import { href, redirect } from 'react-router';

import * as session from '~/account/session';
import { userSession } from '~/models';
import { type Organization } from '~/models/organization';
import { showToast } from '~/ui/components/toast-notification';
import { customFetch } from '~/ui/customFetch';
import { syncOrganizations } from '~/ui/organization-utils';
import { invariant } from '~/utils/invariant';

import type { Route } from './+types/organization._index';

export async function clientLoader(_args: Route.ClientLoaderArgs) {
  const { id } = await userSession.getOrCreate();
  if (id) {
    await customFetch({
      method: 'POST',
      path: '/v1/organizations/ensure-personal',
    });
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

  showToast({
    icon: 'warning',
    title: 'No organizations are associated with your account. Please join an organization before proceeding.',
    status: 'error',
  });

  await session.logout();
  return redirect(href('/auth/login'));
}
