# 軽量な Python 3.11 イメージを開発環境の土台にする
FROM python:3.11-slim

# Git をインストールし、パッケージ一覧のキャッシュを削除して容量を抑える
RUN apt-get update \
    && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*

# コンテナー内の作業ディレクトリを指定する
WORKDIR /workspace

# MkDocs のプレビューで使用するポートを示す
EXPOSE 8000
