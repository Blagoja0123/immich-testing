import { SharedLinkType } from '@immich/sdk';
import { screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'svelte';
import { init, register, waitLocale } from 'svelte-i18n';
import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { renderWithTooltips } from '$tests/helpers';
import { albumFactory } from '@test-data/factories/album-factory';
import { assetFactory } from '@test-data/factories/asset-factory';
import { sharedLinkFactory } from '@test-data/factories/shared-link-factory';
import { handleError } from '$lib/utils/handle-error';
import SharedLinkPage from '$lib/components/pages/SharedLinkPage.svelte';

vi.mock('$lib/components/album-page/AlbumViewer.svelte', async () => await import('@test-data/mocks/AlbumViewer.mock.svelte'));
vi.mock(
  '$lib/components/share-page/IndividualSharedViewer.svelte',
  async () => await import('@test-data/mocks/IndividualSharedViewer.mock.svelte'),
);
vi.mock('$lib/utils/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('$lib/utils/navigation')>()),
  navigate: vi.fn(),
}));
vi.mock('$lib/utils/handle-error', () => ({ handleError: vi.fn() }));

const albumLink = () =>
  sharedLinkFactory.build({
    type: SharedLinkType.Album,
    password: null,
    album: albumFactory.build({ albumName: 'Trip' }),
    assets: [assetFactory.build()],
  });

const individualLink = () =>
  sharedLinkFactory.build({
    type: SharedLinkType.Individual,
    password: null,
    album: undefined,
    assets: [assetFactory.build()],
  });

const renderShared = (data: Record<string, unknown>) =>
  renderWithTooltips(SharedLinkPage, { data } as ComponentProps<typeof SharedLinkPage>);

const submitPassword = async (password: string) => {
  const user = userEvent.setup();
  await user.type(screen.getByPlaceholderText('Password'), password);
  await user.click(screen.getByRole('button', { name: /submit/i }));
};

describe('Shared-link page', () => {
  beforeAll(async () => {
    await init({ fallbackLocale: 'en-US' });
    register('en-US', () => import('$i18n/en.json'));
    await waitLocale('en-US');
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('CT-11 (n1) renders the password gate when a password is required', async () => {
    renderShared({ meta: { title: 'Shared' }, passwordRequired: true, key: 'k1' });

    expect(await screen.findByText(/password required/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('CT-12 (n2) the correct password on an album link reveals the album viewer', async () => {
    sdkMock.sharedLinkLogin.mockResolvedValue(albumLink());
    renderShared({ meta: { title: 'Shared' }, passwordRequired: true, key: 'k1' });

    await submitPassword('secret');

    expect(await screen.findByTestId('album-viewer-stub')).toBeInTheDocument();
    expect(screen.queryByText(/password required/i)).not.toBeInTheDocument();
    expect(sdkMock.sharedLinkLogin).toHaveBeenCalledWith({
      key: 'k1',
      slug: undefined,
      sharedLinkLoginDto: { password: 'secret' },
    });
  });

  it('CT-13 (n3) the correct password on an individual link reveals the individual viewer', async () => {
    sdkMock.sharedLinkLogin.mockResolvedValue(individualLink());
    renderShared({ meta: { title: 'Shared' }, passwordRequired: true, key: 'k1' });

    await submitPassword('secret');

    expect(await screen.findByTestId('individual-viewer-stub')).toBeInTheDocument();
    expect(screen.queryByText(/password required/i)).not.toBeInTheDocument();
  });

  it('CT-14 (n4) a login failure is handled and the gate stays', async () => {
    sdkMock.sharedLinkLogin.mockRejectedValue(new Error('nope'));
    renderShared({ meta: { title: 'Shared' }, passwordRequired: true, key: 'k1' });

    await submitPassword('wrong');

    await waitFor(() => expect(handleError).toHaveBeenCalled());
    expect(screen.getByText(/password required/i)).toBeInTheDocument();
    expect(screen.queryByTestId('album-viewer-stub')).not.toBeInTheDocument();
  });

  it('CT-15 (n5) an album link with no password shows the viewer without a gate', async () => {
    renderShared({ meta: { title: 'Shared' }, passwordRequired: false, sharedLink: albumLink() });

    expect(await screen.findByTestId('album-viewer-stub')).toBeInTheDocument();
    expect(screen.queryByText(/password required/i)).not.toBeInTheDocument();
  });
});
