import { useEffect, useState } from 'react';
import { Button } from 'react-aria-components';
import { href, redirect, type SessionData, useNavigate } from 'react-router';

import { userSession } from '~/models';
import { SCRATCHPAD_ORGANIZATION_ID } from '~/models/organization';
import { SCRATCHPAD_PROJECT_ID } from '~/models/project';
import { SCRATCHPAD_WORKSPACE_ID } from '~/models/workspace';
import { SegmentEvent } from '~/ui/analytics';
import { Icon } from '~/ui/components/icon';
import { createFetcherSubmitHook } from '~/utils/router';

export async function clientAction() {
  const account = await window.main.login();

  if (account) {
    console.log('Login successful');
    window.main.trackSegmentEvent({
      event: SegmentEvent.loginSuccess,
    });
    window.localStorage.setItem('hasUserLoggedInBefore', 'true');

    const userData = await userSession.getOrCreate();
    const sessionData: SessionData = {
      id: account.uniqueId,
      accountId: account.uniqueId!,
      email: account.account!.username,
      name: account.account!.name,
    };

    await userSession.update(userData, sessionData);
  }

  return redirect(href('/organization'));
}

export const useLoginActionFetcher = createFetcherSubmitHook(
  submit => () => {
    submit(
      {},
      {
        action: href('/auth/login'),
        method: 'POST',
      },
    );
  },
  clientAction,
);

const Component = () => {
  const loginFetcher = useLoginActionFetcher();
  const navigate = useNavigate();
  const [message, setMessage] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (loginFetcher.state === 'idle' && loginFetcher.data) {
      setIsLoggingIn(false);
    }
  }, [loginFetcher.state, loginFetcher.data]);

  const login = async () => {
    setIsLoggingIn(true);
    loginFetcher.submit();
  };

  const logoutMessage = window.localStorage.getItem('logoutMessage');
  useEffect(() => {
    if (logoutMessage) {
      window.localStorage.removeItem('logoutMessage');
      setMessage(logoutMessage);
    }
  }, [logoutMessage]);

  return (
    <div className="flex flex-col gap-[--padding-lg]">
      <div className="flex flex-col gap-[--padding-md]">
        <p className="py-[--padding-md] text-center text-2xl text-[--color-font]">Emerson Manila API Studio</p>
        <div className="text-sm font-extrabold [text-wrap:balance]">
          <span className="inline-flex h-[calc(theme(fontSize.sm)*theme(lineHeight.tight))] flex-col overflow-hidden text-indigo-300">
            <ul className="animate-text-slide-4 block text-right leading-tight [&_li]:block">
              <li>Debug</li>
              <li>Design</li>
              <li>Test</li>
              <li>Mock</li>
              <li aria-hidden="true">Debug</li>
            </ul>
          </span>
          <span className="ml-1 text-[--color-font]">APIs locally, on Git or in the Cloud.</span>
        </div>
        {message && <div className="text-sm font-bold text-red-300">{message}</div>}

        <Button
          isDisabled={isLoggingIn}
          aria-label="Continue with SSO"
          onPress={() => {
            login();
          }}
          className="flex w-full items-center justify-center gap-[--padding-md] rounded-md border border-solid border-[--hl-md] text-base text-[--color-font] ring-1 ring-transparent transition-all hover:bg-[--hl-xs] focus:ring-inset focus:ring-[--hl-md] aria-pressed:bg-[--hl-sm]"
        >
          <div className="flex h-[35px] w-[40px] items-center justify-center border-r border-solid border-[--hl-sm] bg-[--hl-xs]">
            <Icon icon="key" />
          </div>
          <span className="items align-center flex flex-1 justify-between">
            Continue with SSO {isLoggingIn && <Icon icon="spinner" className="mr-2 mt-1 animate-spin" />}
          </span>
        </Button>
      </div>

      <div className="flex justify-center">
        <Button
          onPress={() => {
            window.main.trackSegmentEvent({
              event: SegmentEvent.selectScratchpad,
            });
            navigate(
              href('/organization/:organizationId/project/:projectId/workspace/:workspaceId/debug', {
                organizationId: SCRATCHPAD_ORGANIZATION_ID,
                projectId: SCRATCHPAD_PROJECT_ID,
                workspaceId: SCRATCHPAD_WORKSPACE_ID,
              }),
            );
          }}
          aria-label="Use the Scratch Pad"
          className="flex justify-center gap-[--padding-xs] text-sm text-[rgba(var(--color-font-rgb),0.8)] outline-none transition-colors hover:text-[--color-font] focus:text-[--color-font]"
        >
          <div>
            <i className="fa fa-edit" />
          </div>
          <span>Use the local Scratch Pad</span>
        </Button>
      </div>
    </div>
  );
};

export default Component;
