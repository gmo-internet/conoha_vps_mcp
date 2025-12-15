export const conohaGetDescription = `
   JA: ConoHa の 公開 API を利用してサーバー操作を行います。

         • 引数 ‘path’ でアクセス先リソースを指定

         • 利用可能パス: 
               /servers/detail            (サーバー一覧取得)
               /flavors/detail            (フレーバー一覧取得)
               /types                     (ボリュームタイプ一覧取得)
               /volumes/detail            (ボリューム一覧取得)
               /v2/images?limit=200       (イメージ一覧取得)
               /v2.0/security-groups      (セキュリティグループ一覧取得)
               /v2.0/security-group-rules (セキュリティグループルール一覧取得)
               /v2.0/ports                (ポート一覧取得)
               startup-scripts            (スタートアップスクリプト一覧取得)
               
         • 契約に紐づくサーバー管理用途にのみ使用可
   `;

export const conohaGetByParamDescription = `
   JA: ConoHa の 公開 API を利用してサーバー操作を行います。

         • 引数 ‘path’ でアクセス先リソースを指定

         • 利用可能パス: 
               /ips                         (サーバーに紐づくIPアドレス一覧取得)
               /os-security-groups          (サーバーに紐づくセキュリティグループ一覧取得)
               /rrd/cpu                     (サーバーのCPU使用率統計取得)
               /rrd/disk                    (サーバーのディスク使用率統計取得)
               /v2.0/security-groups        (セキュリティグループ詳細取得)
               /v2.0/security-group-rules   (セキュリティグループルール詳細取得)

         • 引数 ‘param’ で必要な値を指定
               /ips, /os-security-groups, /rrd/cpu, /rrd/disk: サーバーID
               /v2.0/security-groups: セキュリティグループID
               /v2.0/security-group-rules: セキュリティグループルールID
               
         • 契約に紐づくサーバー管理用途にのみ使用可
   `;

export const conohaPostDescription = `
   JA: ConoHa の 公開 API を利用してサーバー操作を行います。

         • inputに‘path’と‘requestBody’を指定
         
               {  "input": {
                     "path": <path>,
                     "requestBody": <requestBody>
                  }
               }

         • 引数 ‘path’ でアクセス先リソースを指定
         
         • 利用可能パス: 
               /volumes                   (ボリューム作成 ※imageRef はブートボリューム作成時には必須)
               /servers                   (サーバー作成 ※adminPass はユーザーが指定する必要があります・user_data はBase64エンコードされた文字列を指定する必要があります)
               /os-keypairs               (SSHキーペア作成)
               /v2.0/security-groups      (セキュリティグループ作成)
               /v2.0/security-group-rules (セキュリティグループルール作成 ※port_range_min と port_range_max はユーザーが指定する必要があります)

         • ボリューム作成時の imageRef はブートボリューム作成時には必須です。必ず指定してください。それ以外の場合は任意で構いません。
         
         • サーバー作成時の adminPass はユーザーが指定する必要があります。自動設定しないでください。

         • スタートアップスクリプトを利用する場合、user_data にスタートアップスクリプトを指定する必要があります。

         • スタートアップスクリプトの内容については、必ず初めにスタートアップスクリプト一覧に必要なスクリプトがあるかどうかを確認してください。

         • スタートアップスクリプト一覧に必要なスクリプトがある場合は、fetch_url ツールを用いて内容を該当のスクリプトの URL から取得し、encode_base64 ツールを用いてその内容をBase64エンコードした文字列を user_data に指定してください。スタートアップスクリプトにパラメータを渡す必要がある場合は、内容にパラメータを含めた上で encode_base64 ツールを用いてBase64エンコードした文字列を user_data に指定してください。

         • スタートアップスクリプト一覧に必要なスクリプトがない場合は、スタートアップスクリプト一覧から fetch_url ツールを用いて取得したスクリプトを参考にして、インストールしたいソフトウェアやライブラリのインストールコマンドなどを記載した新たなスタートアップスクリプトを作成し、そのスクリプトの内容を encode_base64 ツールを用いてBase64エンコードした文字列を user_data に指定してください。

         • user_data を指定する場合は、必ず encode_base64 ツールを用いてBase64エンコードされた文字列を指定してください。自動エンコードしないでください。

         • セキュリティグループルールの tcp または udp プロトコルを使用する場合、port_range_min と port_range_max の値はユーザーが指定する必要があります。自動設定しないでください。

         • 引数 ‘requestBody’ でリクエストボディを指定
               /servers: 
               {  "server": {
                     "flavorRef": string,                // Flavor ID
                     "adminPass": string,                // Admin/root password for the server: Must be specified by the user. Do not set automatically. (9-70 characters, must include uppercase letters, lowercase letters, numbers, and symbols, available symbols are \^$+-*/|()[]{}.,?!_=&@~%#:;'" )
                     "block_device_mapping_v2": [        // One or more volume mappings
                        {  "uuid": string  }             // Volume UUID to boot from
                     ],
                     "metadata": {
                        "instance_name_tag": string      // Display name of the server (1-255 alphanumeric characters, underscores, or hyphens) (optional)
                     },
                     "security_groups": [                // List of security groups (optional)
                        {  "name": string  }             // Name of the security group
                     ],
                     "key_name": string                  // Name of the SSH key pair (optional)
                     "user_data": string                 // Base64 encoded startup script (optional)
                  }
               }

               /os-keypairs:
               {  "keypair": {
                     "name": string,                 // Name of the the ssh key pair (alphanumeric characters, underscores, or hyphens)
                     "public_key": string            // Public key of the ssh key pair
                  }
               }

               /volumes:
               {  "volume": {
                     "size": number,                 // Size of the volume in GB (30, 100, 200, 500, 1000, 5000, 10000)
                     "description": string,          // Description of the volume (nullable)
                     "name": string,                 // Name of the volume (1-255 alphanumeric characters, underscores, or hyphens)
                     "volume_type": string,          // Type of the volume (name or ID)
                     "imageRef": string              // Image ID to create the volume from (optional, required for boot volume)
                  }
               }

               /v2.0/security-groups:
               {  "security_group": {
                     "name": string,                  // Name of the security group
                     "description": string            // Description of the security group (optional)
                  }
               }

               /v2.0/security-group-rules:
               {  "security_group_rule": {
                     "security_group_id": string,                 // ID of the security group
                     "direction": "ingress" | "egress",           // Direction of the rule (ingress or egress)
                     "ethertype": "IPv4" | "IPv6",                // Ethertype (IPv4 or IPv6) (optional, default is IPv4)
                     "port_range_min": number,                    // Minimum port range (optional): Must be specified by the user. Do not set automatically.
                     "port_range_max": number,                    // Maximum port range (optional): Must be specified by the user. Do not set automatically.
                     "protocol": "tcp" | "udp" | "icmp" | null,   // Protocol (optional)
                     "remote_ip_prefix": string,                  // CIDR for remote IP (optional)
                     "remote_group_id": string                    // ID of the remote security group (optional)
                  }
               }
            
         • 契約に紐づくサーバー管理用途にのみ使用可
   `;

export const conohaPostPutByParamDescription = `
   JA: ConoHa の 公開 API を利用してサーバー操作を行います。
   
         • inputに‘path’, ‘param’, ‘requestBody’を指定
         
               {  "input": {
                     "path": <path>,
                     "param": <param>,
                     "requestBody": <requestBody>
                  }
               }

         • 引数 ‘path’ でアクセス先リソースを指定

         • 利用可能パス: 
               /action               (サーバー操作)
               /remote-consoles      (リモートコンソールURL取得)
               /os-volume_attachments (ボリュームアタッチ)
               /v2.0/security-groups (セキュリティグループ更新)
               /volumes              (ボリューム更新)
               /v2.0/ports           (ポート更新)

         • 引数 'param' で必要な値を指定
               /action, /remote-consoles, /os-volume_attachments: サーバーID
               /v2.0/security-groups: セキュリティグループID
               /volumes: ボリュームID
               /v2.0/ports: ポートID

         • 引数 ‘requestBody’ でリクエストボディを指定
               /action:
               {  "os-start": null   }                // Start the server
               or
               {  "os-stop": null    }                // Stop the server
               or
               {  "os-stop": {                        // Stop the server
                     "force_shutdown": true | false   // Force shutdown
                  }
               }
               or
               {  "os-reboot": {                      // Reboot the server
                     "type": "SOFT" | "HARD"          // Reboot type (soft or hard)
                  }
               }
               or
               {  "resize": {                         // Resize the server
                     "flavorRef": string              // Flavor ID to resize to
                  }
               }
               or
               {  "confirmResize": null   }           // Confirm the resize
               or
               {  "revertResize": null    }           // Revert the resize

               /remote-consoles:
               {  "remote_console": {
                     "protocol": "vnc" | "spice" | "serial",   // Protocol for the remote console
                     "type": "novnc" | "serial"                // Type of the remote console
                  }
               }

               /os-volume_attachments:
               {  "volumeAttachment": {
                     "volumeId": string                        // Volume ID to attach
                  }
               }

               /v2.0/security-groups:
               {  "security_group": {
                     "name": string,                 // Name of the security group (optional)
                     "description": string           // Description of the security group (optional)
                  }
               }

               /volumes:
               {  "volume": {
                     "name": string,                 // Name of the volume (optional) (1-255 alphanumeric characters, underscores, or hyphens)
                     "description": string           // Description of the volume (optional)
                  }
               }

               /v2.0/ports:
               {  "port": {
                     "security_groups": [string]       // List of security group IDs to associate with the port (optional)
                  }
               }
                  
         • 契約に紐づくサーバー管理用途にのみ使用可
   `;

export const conohaDeleteByParamDescription = `
   JA: ConoHa の 公開 API を利用してサーバー操作を行います。
   
         • 引数 ‘path’ でアクセス先リソースを指定

         • 利用可能パス: 
               /servers                   (サーバー削除)
               /os-keypairs               (SSHキーペア削除)
               /v2.0/security-groups      (セキュリティグループ削除)
               /v2.0/security-group-rules (セキュリティグループルール削除)
               /volumes                   (ボリューム削除)

         • 引数 ‘param’ で必要な値を指定
               /servers: サーバーID
               /os-keypairs: SSHキーペア名
               /v2.0/security-groups: セキュリティグループID
               /v2.0/security-group-rules: セキュリティグループルールID
               /volumes: ボリュームID

         • 契約に紐づくサーバー管理用途にのみ使用可
   `;

export const createServerDescription = `
   JA: ConoHa の 公開 API を利用して新しいサーバーを作成します。
        • rootパスワードは必ずユーザー自身が指定したものを設定してください。
        • rootパスワードは9~70文字の半角英数記号の組み合わせで指定してください。
        • rootパスワードにはアルファベット大文字、小文字、数字、記号をそれぞれ含めてください。(利用可能な記号は \^$+-*/|()[]{}.,?!_=&@~%#:;'" です)
        • rootパスワードの作成条件に誤りがあった場合でも、必ずユーザー自身にパスワードの再入力を依頼し、ユーザーが指定した値のみをadminPassに設定してください。
   `;

export const fetchUrlDescription = `
  JA: 指定したURLからコンテンツを取得します。

         • 引数 'url' に取得したいURLを指定
         • URLはhttp://またはhttps://で始まる必要があります
         • 取得したコンテンツはテキスト形式で返されます
`;

export const encodeBase64Description = `
  JA: 指定した文字列をBase64エンコードします。

         • 引数 'text' にエンコードしたい文字列を指定
         • エンコードされた文字列はテキスト形式で返されます
         • 1文字以上10000文字以下のテキストを指定してください
`;
