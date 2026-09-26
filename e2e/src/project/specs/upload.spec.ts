import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/test.js';
import { installUploadMock } from '../mocks/upload.js';

type ChosenFile = { name: string; mimeType: string; buffer: Buffer };

async function chooseFiles(page: Page, files: ChosenFile | ChosenFile[]) {
  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Upload', exact: true }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles(files);
}

const jpeg = (name: string): ChosenFile => ({ name, mimeType: 'image/jpeg', buffer: Buffer.from('fake-jpeg-bytes') });

test.describe('Upload', () => {
  test('UP-01: selecting a new file uploads it', async ({ page, mockedApp }) => {
    await mockedApp.loginAs();
    const uploads = await installUploadMock(mockedApp.context);

    await page.goto('/photos');
    const chooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Upload', exact: true }).click();
    const chooser = await chooserPromise;
    await chooser.setFiles({ name: 'sunset.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('fake-jpeg-bytes') });

    await expect.poll(() => uploads.length).toBe(1);
  });

  test('UP-02: a file that already exists is not re-uploaded', async ({ page, mockedApp }) => {
    await mockedApp.loginAs();
    const uploads = await installUploadMock(mockedApp.context, { duplicateFileNames: ['sunset.jpg'] });

    await page.goto('/photos');
    const chooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Upload', exact: true }).click();
    const chooser = await chooserPromise;
    await chooser.setFiles({ name: 'sunset.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('fake-jpeg-bytes') });

    await page.waitForTimeout(1000);
    expect(uploads.length).toBe(0);
  });

  test('UP-03: multiple selected files are all uploaded', async ({ page, mockedApp }) => {
    await mockedApp.loginAs();
    const uploads = await installUploadMock(mockedApp.context);

    await page.goto('/photos');
    await chooseFiles(page, [jpeg('one.jpg'), jpeg('two.jpg')]);

    await expect.poll(() => uploads.length).toBe(2);
  });

  test('UP-04: a failed upload is reported as an error', async ({ page, mockedApp }) => {
    await mockedApp.loginAs();
    const uploads = await installUploadMock(mockedApp.context, { failUpload: true });

    await page.goto('/photos');
    await chooseFiles(page, jpeg('sunset.jpg'));

    await expect.poll(() => uploads.length).toBe(1);
    await expect(page.getByText('Unable to upload file').first()).toBeVisible();
  });

  test('UP-05: an unsupported file type is rejected before any upload request', async ({ page, mockedApp }) => {
    await mockedApp.loginAs();
    const uploads = await installUploadMock(mockedApp.context);

    await page.goto('/photos');
    await chooseFiles(page, { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('not an image') });

    await expect(page.getByText('is not supported', { exact: false })).toBeVisible();
    expect(uploads.length).toBe(0);
  });
});
