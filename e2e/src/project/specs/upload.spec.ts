import { test, expect } from '../fixtures/test.js';
import { installUploadMock } from '../mocks/upload.js';



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
});
