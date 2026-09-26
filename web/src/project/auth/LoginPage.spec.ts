/**
 * Component tests for the login route (src/routes/auth/login/+page.svelte),
 * rendered in isolation with @testing-library/svelte. The SDK is replaced by
 * `sdkMock` and SvelteKit navigation by a `goto` spy, so these run with no
 * browser, dev server or backend.
 *
 * Graph Coverage — handleLogin() control flow after a successful login():
 *   n1 isAdmin && !server.isOnboarded      -> onboarding
 *   n2 !isAdmin && shouldChangePassword    -> change-password
 *   n3 !isOnboarded                        -> onboarding
 *   n4 otherwise                           -> continueUrl
 *   n5 login() throws                      -> error Alert (server message | fallback)
 * One test per edge gives full branch coverage of handleLogin.
 */
import type { LoginResponseDto, ServerConfigDto, PublicConfigDto } from '@immich/sdk';
import { screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { init, register, waitLocale } from 'svelte-i18n';
import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { serverConfigManager } from '$lib/managers/server-config-manager.svelte';
import { Route } from '$lib/route';
import { renderWithTooltips } from '$tests/helpers';
import LoginPage from '../../routes/auth/login/+page.svelte';

const { goto } = vi.hoisted(() => ({ goto: vi.fn() }));
vi.mock('$app/navigation', () => ({ goto }));

const CONTINUE_URL = '/photos';

const publicConfig = (overrides: Partial<PublicConfigDto> = {}) =>
  ({
    oauth: { enabled: false, autoLaunch: false, buttonText: 'Login with OAuth' },
    passwordLogin: { enabled: true },
    server: { loginPageMessage: '' },
    theme: { customCss: '' },
    ...overrides,
  }) as PublicConfigDto;

const loginResponse = (overrides: Partial<LoginResponseDto> = {}): LoginResponseDto => ({
  accessToken: 'token',
  isAdmin: false,
  isOnboarded: true,
  name: 'Test User',
  profileImagePath: '',
  shouldChangePassword: false,
  userEmail: 'user@example.com',
  userId: 'a6f0a7b4-2b0f-4b43-9b1e-6d0f1c2e3a4b',
  ...overrides,
});

const renderLogin = (config = publicConfig()) =>
  // PasswordInput's show/hide toggle renders a Tooltip, which needs the provider TestWrapper adds.
  renderWithTooltips(LoginPage, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { meta: { title: 'Login' }, continueUrl: CONTINUE_URL, publicConfig: config } as any,
  });

const submit = async (email = 'user@example.com', password = 'secret') => {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText(/email/i), email);
  await user.type(screen.getByLabelText(/password/i), password);
  await user.click(screen.getByRole('button', { name: /login/i }));
};

const setServerOnboarded = async (isOnboarded: boolean) => {
  sdkMock.getServerConfig.mockResolvedValue({ isOnboarded } as ServerConfigDto);
  await serverConfigManager.init();
};

describe('Login page', () => {
  beforeAll(async () => {
    await init({ fallbackLocale: 'en-US' });
    register('en-US', () => import('$i18n/en.json'));
    await waitLocale('en-US');
  });

  beforeEach(async () => {
    vi.resetAllMocks();
    await setServerOnboarded(true);
  });

  describe('rendering (public config)', () => {
    it('CT-01 shows the email/password form when password login is enabled', async () => {
      renderLogin();
      expect(await screen.findByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('CT-02 shows the admin login page message', async () => {
      renderLogin(publicConfig({ server: { loginPageMessage: 'Welcome to <b>our</b> server' } }));
      expect(await screen.findByText(/welcome to/i)).toBeInTheDocument();
    });

    it('CT-03 shows a warning and no form when every login method is disabled', async () => {
      renderLogin(publicConfig({ passwordLogin: { enabled: false } }));
      expect(await screen.findByText(/login has been disabled/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
    });
  });

  describe('submitting credentials', () => {
    it('CT-04 sends the typed credentials to the login API', async () => {
      sdkMock.login.mockResolvedValue(loginResponse());
      renderLogin();
      await submit('alice@example.com', 'hunter2');
      expect(sdkMock.login).toHaveBeenCalledWith({
        loginCredentialDto: { email: 'alice@example.com', password: 'hunter2' },
      });
    });

    it('CT-05 (n4) an onboarded user is sent to the continue URL', async () => {
      sdkMock.login.mockResolvedValue(loginResponse());
      renderLogin();
      await submit();
      await waitFor(() => expect(goto).toHaveBeenCalledWith(CONTINUE_URL, { invalidateAll: true }));
    });

    it('CT-06 (n1) an admin on a non-onboarded server is sent to onboarding', async () => {
      await setServerOnboarded(false);
      sdkMock.login.mockResolvedValue(loginResponse({ isAdmin: true }));
      renderLogin();
      await submit();
      await waitFor(() => expect(goto).toHaveBeenCalledWith(Route.onboarding()));
    });

    it('CT-07 (n2) a user who must change their password is sent to change-password', async () => {
      sdkMock.login.mockResolvedValue(loginResponse({ shouldChangePassword: true }));
      renderLogin();
      await submit();
      await waitFor(() => expect(goto).toHaveBeenCalledWith(Route.changePassword()));
    });

    it('CT-08 (n3) a user who is not onboarded is sent to onboarding', async () => {
      sdkMock.login.mockResolvedValue(loginResponse({ isOnboarded: false }));
      renderLogin();
      await submit();
      await waitFor(() => expect(goto).toHaveBeenCalledWith(Route.onboarding()));
    });

    it('CT-09 (n5) a server error message is shown in an alert', async () => {
      sdkMock.isHttpError.mockReturnValue(true);
      sdkMock.login.mockRejectedValue({ data: { message: 'Incorrect email or password' } });
      renderLogin();
      await submit();
      expect(await screen.findByText('Incorrect email or password')).toBeInTheDocument();
      expect(goto).not.toHaveBeenCalled();
    });

    it('CT-10 (n5) a non-HTTP failure falls back to the generic message', async () => {
      sdkMock.isHttpError.mockReturnValue(false);
      sdkMock.login.mockRejectedValue(new Error('network down'));
      renderLogin();
      await submit();
      expect(await screen.findByText(/incorrect email or password/i)).toBeInTheDocument();
      expect(goto).not.toHaveBeenCalled();
    });
  });
});
