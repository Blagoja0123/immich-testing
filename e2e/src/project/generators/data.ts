let userCounter = 0;
let assetCounter = 0;
let albumCounter = 0;


export function toUuid(kind: 'a' | 'b' | 'c' | 'd', n: number): string {
  const hex = n.toString(16).padStart(12, '0');
  return `00000000-0000-4000-8000-${kind}${hex.slice(1)}`;
}

export interface MockUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

export function createUser(overrides: Partial<MockUser> = {}): MockUser {
  userCounter += 1;
  return {
    id: overrides.id ?? toUuid('a', userCounter),
    email: overrides.email ?? `user${userCounter}@example.com`,
    name: overrides.name ?? `Test User ${userCounter}`,
    isAdmin: overrides.isAdmin ?? true,
  };
}

/** Full UserAdminResponseDto shape, as required by GET /api/users/me. */
export function toUserAdminResponse(user: MockUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    profileImagePath: '',
    avatarColor: 'primary',
    profileChangedAt: '2026-01-01T00:00:00.000Z',
    storageLabel: user.name,
    shouldChangePassword: false,
    isAdmin: user.isAdmin,
    createdAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    updatedAt: '2026-01-01T00:00:00.000Z',
    oauthId: '',
    quotaSizeInBytes: null,
    quotaUsageInBytes: 0,
    status: 'active',
    license: null,
  };
}

export function toUserPreferencesResponse() {
  return {
    albums: { defaultAssetOrder: 'desc' },
    folders: { enabled: false, sidebarWeb: false },
    memories: { enabled: true, duration: 5 },
    people: { enabled: true, sidebarWeb: false },
    sharedLinks: { enabled: true, sidebarWeb: false },
    ratings: { enabled: false },
    tags: { enabled: false, sidebarWeb: false },
    emailNotifications: { enabled: false, albumInvite: false, albumUpdate: false },
    download: { archiveSize: 4_294_967_296, includeEmbeddedVideos: false },
    purchase: { showSupportBadge: false, hideBuyButtonUntil: '2100-01-01T00:00:00.000Z' },
    cast: { gCastEnabled: false },
    recentlyAdded: { sidebarWeb: false },
  };
}

export interface MockAsset {
  id: string;
  originalFileName: string;
  type: 'IMAGE' | 'VIDEO';
  isFavorite: boolean;
  isArchived: boolean;
  localDateTime: string;
}

export function createAsset(overrides: Partial<MockAsset> = {}): MockAsset {
  assetCounter += 1;
  return {
    id: overrides.id ?? toUuid('b', assetCounter),
    originalFileName: overrides.originalFileName ?? `IMG_${String(assetCounter).padStart(4, '0')}.jpg`,
    type: overrides.type ?? 'IMAGE',
    isFavorite: overrides.isFavorite ?? false,
    isArchived: overrides.isArchived ?? false,
    localDateTime: overrides.localDateTime ?? '2026-01-15T12:00:00.000Z',
  };
}

export interface MockAlbum {
  id: string;
  albumName: string;
  assetCount: number;
}

export function createAlbum(overrides: Partial<MockAlbum> = {}): MockAlbum {
  albumCounter += 1;
  return {
    id: overrides.id ?? toUuid('c', albumCounter),
    albumName: overrides.albumName ?? `Test Album ${albumCounter}`,
    assetCount: overrides.assetCount ?? 0,
  };
}

export function toAlbumResponse(album: MockAlbum, owner: MockUser) {
  return {
    id: album.id,
    albumName: album.albumName,
    description: '',
    albumThumbnailAssetId: null,
    albumUsers: [
      {
        role: 'owner',
        user: {
          id: owner.id,
          name: owner.name,
          email: owner.email,
          avatarColor: 'primary',
          profileChangedAt: '2026-01-01T00:00:00.000Z',
          profileImagePath: '',
        },
      },
    ],
    assetCount: album.assetCount,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    hasSharedLink: false,
    isActivityEnabled: true,
    shared: false,
  };
}

let sharedLinkCounter = 0;

export function nextSharedLinkId(): string {
  sharedLinkCounter += 1;
  return toUuid('d', sharedLinkCounter);
}

export function resetCounters() {
  userCounter = 0;
  assetCounter = 0;
  albumCounter = 0;
  sharedLinkCounter = 0;
}
