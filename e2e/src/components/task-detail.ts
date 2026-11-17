import { expect, Page } from '@playwright/test';

/** Reusable Component Object for the task detail editor. */
export class TaskDetail {
  constructor(readonly page: Page) {}
  field(name: string) { return this.page.getByTestId(`task-${name}`); }
  async save() {
    const response = this.page.waitForResponse(r => r.request().method() === 'PATCH' && /\/api\/tasks\/[^/]+$/.test(r.url()));
    await this.field('save-button').click();
    return response;
  }
  async addTag(name: string) {
    await this.page.getByTestId('tag-add-input').fill(name);
    const response = this.page.waitForResponse(r => r.request().method() === 'POST' && r.url().endsWith('/tags'));
    await this.page.getByTestId('tag-add-button').click();
    await response;
    await expect(this.field('detail-page')).toBeVisible();
  }
  async reload() {
    await this.page.reload();
    await expect(this.field('detail-page')).toBeVisible();
  }
}
