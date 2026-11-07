# Koalitionsprotokoll

## 发布到 GitHub Pages

1. 解压 ZIP，把解压出来的文件和目录上传到仓库根目录，保留原有层级。确认 `index.html` 和 `foto/` 位于同一层。`.nojekyll` 也一起提交。
2. 在仓库打开 **Settings → Pages**，Source 选 **Deploy from a branch**，选择已上传的分支（通常为 `main`）和 **/(root)**，保存。
3. 等待 Pages 完成部署，从该设置页打开站点链接。

直接打开 `index.html` 也可以在本机游玩。游玩只需浏览器。修改源码后，如需重建 HTML，请在根目录用装有 Pillow 的 Python 运行 `python3 build.py`。

代码许可证及第三方声明见 `LICENSE-GPL-3.0` 和 `THIRD_PARTY_NOTICES.md`，字体许可见 `web/assets/news/OFL.txt`。

[GitHub Pages 官方配置说明](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
