# ConoHa-MCP

## 要件

- Node.js v22.11.0以上
- pnpm v10.6.5以上（`npm install -g pnpm`でインストール可能）

## 初回

```bash
git clone https://github.com/gmo-ig/conoha-mcp.git
cd conoha-mcp
pnpm install
```

## 利用方法

vscodeのグローバルのsettings.jsonに下記を記載し、サーバーを起動（PATH_TO_DIRECTORYは自身のものに置き換える）

環境変数の入力を求められるので、自身のConoHa VPS Ver.3.0のアカウント情報を入力

```json
    "mcp": {
        "inputs": [
            {
                "type": "promptString",
                "id": "openstack-tenant-id",
                "description": "OpenStack Tenant ID",
            },
            {
                "type": "promptString",
                "id": "openstack-user-id",
                "description": "OpenStack User ID",
            },
            {
                "type": "promptString",
                "id": "openstack-password",
                "description": "OpenStack Password",
                "password": true
            }
        ],
        "servers": {
            "conoha-stdio": {
                "command": "pnpm",
                "args": [
                    "--dir",
                    "PATH_TO_DIRECTORY",
                    "start"
                ],
                "env": {
                    "OPENSTACK_TENANT_ID": "${input:openstack-tenant-id}",
                    "OPENSTACK_USER_ID": "${input:openstack-user-id}",
                    "OPENSTACK_PASSWORD": "${input:openstack-password}",
                }
            }
        }
    },
```

## package.json がアップデートされたら

```bash
pnpm install
```

## 開発環境実行

```bash
npx @modelcontextprotocol/inspector pnpm start
```

を実行し、[Inspector](http://127.0.0.1:6274/#resources) にアクセス

## formatter & linter 実行 (autofix)

```bash
pnpm check:fix
```
