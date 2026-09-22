const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const failures = [];
const views = [
  { name: 'desktop-proof', width: 1440, height: 1000 },
  { name: 'mobile-proof', width: 390, height: 844 },
  { name: 'narrow-proof', width: 320, height: 740 }
];

app.whenReady().then(async () => {
  const window = new BrowserWindow({ show: false, webPreferences: { sandbox: true, backgroundThrottling: false } });
  window.webContents.on('console-message', (event) => {
    if (event.level === 'error') failures.push(`console: ${event.message}`);
  });

  for (const view of views) {
    window.setContentSize(view.width, view.height);
    await window.loadFile(path.join(root, 'index.html'));
    await new Promise((resolve) => setTimeout(resolve, 300));
    const metrics = await window.webContents.executeJavaScript(`(() => {
      const ids = [...document.querySelectorAll('[id]')].map((node) => node.id);
      const links = [...document.querySelectorAll('a[href]')];
      const brokenFragments = links.map((link) => link.getAttribute('href')).filter((href) => href.startsWith('#') && !document.getElementById(href.slice(1)));
      const localFiles = [...document.querySelectorAll('[src],link[href]')].map((node) => node.getAttribute('src') || node.getAttribute('href')).filter((ref) => ref && !ref.startsWith('#') && !ref.startsWith('http')).concat([...document.querySelectorAll('[srcset]')].flatMap((node) => node.getAttribute('srcset').split(',').map((candidate) => candidate.trim().split(/\\s+/)[0])));
      const unnamedControls = [...document.querySelectorAll('button,input,textarea')].filter((node) => !node.matches('[aria-label]') && !node.closest('label') && !node.labels?.length && !node.textContent.trim()).length;
      const smallButtons = [...document.querySelectorAll('button')].filter((node) => {
        const box = node.getBoundingClientRect();
        return box.width && box.height && (box.width < 44 || box.height < 44);
      }).map((node) => node.getAttribute('aria-label') || node.textContent.trim());
      return {
        title: document.title,
        h1: document.querySelectorAll('h1').length,
        duplicateIds: ids.filter((id, index) => ids.indexOf(id) !== index),
        brokenFragments,
        localFiles,
        unnamedControls,
        smallButtons,
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        images: [...document.images].map((image) => ({ src: image.getAttribute('src'), alt: image.getAttribute('alt'), complete: image.complete, naturalWidth: image.naturalWidth }))
      };
    })()`);
    metrics.missingFiles = metrics.localFiles.filter((ref) => !fs.existsSync(path.join(root, ref)));
    console.log(`${view.name}: ${JSON.stringify(metrics)}`);
    if (metrics.h1 !== 1 || metrics.duplicateIds.length || metrics.brokenFragments.length || metrics.missingFiles.length || metrics.unnamedControls || metrics.smallButtons.length || metrics.horizontalOverflow || metrics.images.some((image) => image.alt === null) || !metrics.images[0]?.naturalWidth) failures.push(`${view.name}: structural or responsive check failed`);

    if (view.width === 390) {
      await window.webContents.executeJavaScript(`document.querySelector('[data-menu-button]').focus(); document.querySelector('[data-menu-button]').click()`);
      await new Promise((resolve) => setTimeout(resolve, 50));
      const menu = await window.webContents.executeJavaScript(`({ open: document.querySelector('[data-mobile-menu]').classList.contains('open'), expanded: document.querySelector('[data-menu-button]').getAttribute('aria-expanded'), locked: document.body.classList.contains('locked'), focusedInside: document.querySelector('[data-mobile-menu]').contains(document.activeElement) })`);
      await window.webContents.executeJavaScript(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
      await new Promise((resolve) => setTimeout(resolve, 50));
      const menuClosed = await window.webContents.executeJavaScript(`document.querySelector('[data-menu-button]').getAttribute('aria-expanded') === 'false' && document.activeElement === document.querySelector('[data-menu-button]')`);
      await window.webContents.executeJavaScript(`document.querySelector('[data-mobile-menu] [data-apply]').click()`);
      await new Promise((resolve) => setTimeout(resolve, 50));
      const dialog = await window.webContents.executeJavaScript(`({ open: document.querySelector('[data-application]').open, modal: document.querySelector('[data-application]').matches(':modal') })`);
      console.log(`mobile-interactions: ${JSON.stringify({ menu, menuClosed, dialog })}`);
      if (!menu.open || menu.expanded !== 'true' || !menu.locked || !menu.focusedInside || !menuClosed || !dialog.open || !dialog.modal) failures.push('mobile interaction check failed');
      await window.webContents.executeJavaScript(`document.querySelector('[data-application]').close()`);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const image = await window.webContents.capturePage();
    fs.writeFileSync(path.join(root, `${view.name}.png`), image.toPNG());
  }

  window.destroy();
  if (failures.length) {
    console.error(failures.join('\n'));
    app.exitCode = 1;
    app.quit();
    return;
  }
  console.log('Aster House browser verification passed with no console errors.');
  app.quit();
});
