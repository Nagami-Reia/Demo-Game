# 人物照片

照片放在这个文件夹，文件名用日常姓名或完整人名，例如 `Jens Spahn.jpg`、`Mathias Middelberg.png`、`Carsten Linnemann.webp`。例如 `Fabian Gramling.jpg` 也可以匹配其完整登记姓名。支持 JPG/JPEG、PNG、WebP、AVIF，扩展名大小写均可。空格和下划线可以匹配；ü/ue、ö/oe、ä/ae、ß/ss也可匹配。

建议用竖向半身照，头顶留些空间。图片保留原文件，不会自动裁掉原图。同一人物若有多个版本，用 `data/portraits.json` 指定要用的文件，避免挑错。

放完后告诉我，我会重新生成 HTML、检查匹配，并用真实照片调裁切。当前是构建时匹配，单独放入文件不会让已经打开的旧 HTML 自动更新。

`index.html` 与本文件夹放在同一游戏目录下使用；以后发布 GitHub Pages 时也一起上传，照片不内嵌到 HTML。

个别照片可在 `data/portraits.json` 按人物ID覆盖：

```json
{
  "Linnemann": {
    "file": "Carsten Linnemann.webp",
    "x": 75,
    "y": 0,
    "height": 65
  }
}
```

x/y为图片在容器中的百分比位置，height为照片层占卡片高度的百分比。未匹配到照片的人物保留文字卡，空目录不会改变页面。样式单独放在 `web/styles/portraits.css`，后续照片处理不影响其他布局样式。
