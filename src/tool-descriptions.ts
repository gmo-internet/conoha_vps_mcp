export const conohaOpenstackGetNoParamDescription = `
   JA: ConoHa の OpenStack API を利用してサーバー操作を行います。

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
               
         • 契約に紐づくサーバー管理用途にのみ使用可
   `;

export const conohaOpenstackGetIdDescription = `
   JA: ConoHa の OpenStack API を利用してサーバー操作を行います。

         • 引数 ‘path’ でアクセス先リソースを指定

         • 利用可能パス: 
               /ips                         (サーバーに紐づくIPアドレス一覧取得)
               /os-security-groups          (サーバーに紐づくセキュリティグループ一覧取得)
               /rrd/cpu                     (サーバーのCPU使用率統計取得)
               /rrd/disk                    (サーバーのディスク使用率統計取得)
               /v2.0/security-groups        (セキュリティグループ詳細取得)
               /v2.0/security-group-rules   (セキュリティグループルール詳細取得)

         • 引数 ‘id’ で必要なidを指定
               /ips, /os-security-groups, /rrd/cpu, /rrd/disk: サーバーID
               /v2.0/security-groups: セキュリティグループID
               /v2.0/security-group-rules: セキュリティグループルールID
               
         • 契約に紐づくサーバー管理用途にのみ使用可
   `;

export const conohaOpenstackPostRequestBodyDescription = `
   JA: ConoHa の OpenStack API を利用してサーバー操作を行います。

         • inputに‘path’と‘requestBody’を指定

         • 引数 ‘path’ でアクセス先リソースを指定
         
         • 利用可能パス: 
               /volumes                   (ボリューム作成)
               /servers                   (サーバー作成 ※adminPass はユーザーが指定する必要があります)
               /os-keypairs               (SSHキーペア作成)
               /v2.0/security-groups      (セキュリティグループ作成)
               /v2.0/security-group-rules (セキュリティグループルール作成 ※port_range_min と port_range_max はユーザーが指定する必要があります)

         • サーバー作成時の adminPass はユーザーが指定する必要があります。自動設定しないでください。

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
                     "key_name": string                 // Name of the SSH key pair (optional)
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
                     "imageRef": string              // Image ID to create the volume from
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

export const conohaOpenstackPostPutRequestBodyIdDescription = `
   JA: ConoHa の OpenStack API を利用してサーバー操作を行います。
   
         • inputに‘path’, ‘id’, ‘requestBody’を指定

         • 引数 ‘path’ でアクセス先リソースを指定

         • 利用可能パス: 
               /action               (サーバー操作)
               /remote-consoles      (リモートコンソールURL取得)
               /v2.0/security-groups (セキュリティグループ更新)
               /volumes              (ボリューム更新)
               /v2.0/ports           (ポート更新)

         • 引数 ‘id’ で必要なidを指定
               /action, /remote-consoles: サーバーID
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

export const conohaOpenstackDeleteIdDescription = `
   JA: ConoHa の OpenStack API を利用してサーバー操作を行います。
   
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
   JA: ConoHa の OpenStack API を利用して新しいサーバーを作成します。
        • rootパスワードは9~70文字の半角英数記号の組み合わせで指定してください。
        • rootパスワードにはアルファベット大文字、小文字、数字、記号をそれぞれ含めてください。(利用可能な記号は \^$+-*/|()[]{}.,?!_=&@~%#:;'" です)
   `;
