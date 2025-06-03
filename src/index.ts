import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import "dotenv/config";
import {
   deleteOpenstackComputeApiId,
   getOpenstackComputeApi,
   getOpenstackComputeApiId,
   postOpenstackComputeApiRequestBody,
   postOpenstackComputeApiRequestBody1Id,
} from "./feature/openstack/fetch-compute";
import { getOpenstackImageApi } from "./feature/openstack/fetch-image";
import {
   deleteOpenstackNetworkApiId,
   getOpenstackNetworkApi,
   getOpenstackNetworkApiId,
   postOpenstackNetworkApiRequestBody,
   putOpenstackNetworkApiRequestBody1Id,
} from "./feature/openstack/fetch-network";
import {
   deleteOpenstackVolumeApiId,
   getOpenstackVolumeApi,
   postOpenstackVolumeApiRequestBody,
   putOpenstackVolumeApiRequestBody1Id,
} from "./feature/openstack/fetch-volume";
// import { getRagApi } from "./feature/rag/fetch-rag";
import {
   CreateSecurityGroupRequestSchema,
   CreateSecurityGroupRuleRequestSchema,
   CreateServerRequestSchema,
   CreateVolumeRequestSchema,
   OperateServerRequestSchema,
   RemoteConsoleRequestSchema,
   UpdatePortRequestSchema,
   UpdateSecurityGroupRequestSchema,
   UpdateVolumeRequestSchema,
} from "./feature/openstack/schema";

const server = new McpServer({ name: "conoha-stdio", version: "0.2.0" });

server.tool(
   "conoha_openstack_get_noparam",
   `
   * EN: Perform ConoHa contract-bound operations via the OpenStack API.
   *      • Argument ‘path’ selects the resource to call.
   *      • Only the following paths are allowed:
   *           /servers/detail            (list servers) 
   *           /flavors/detail            (list available flavors) 
   *           /types                     (list available volume types)
   *           /volumes/detail            (list available volumes)
   *           /v2/images                 (list available images)
   *           /v2.0/security-groups      (list security groups)
   *           /v2.0/security-group-rules (list security group rules)
   *           /v2.0/ports                (list ports)
   *      • Use strictly for server management or other actions tied to an active contract.
   *
   * JA: ConoHa の OpenStack API を利用してサーバー操作を行います。
   *      • 引数 ‘path’ でアクセス先リソースを指定
   *      • 利用可能パス: /servers/detail, /flavors/detail, /types, /volumes/detail, /v2/images, /v2.0/security-groups, /v2.0/security-group-rules, /v2.0/ports
   *      • 契約に紐づくサーバー管理用途にのみ使用可
   `,
   {
      path: z.enum([
         "/servers/detail",
         "/flavors/detail",
         "/types",
         "/volumes/detail",
         "/v2/images",
         "/v2.0/security-groups",
         "/v2.0/security-group-rules",
         "/v2.0/ports",
      ]),
   },
   async ({ path }) => {
      let response: string;

      switch (path) {
         case "/servers/detail":
         case "/flavors/detail":
            response = await getOpenstackComputeApi(path);
            break;

         case "/types":
         case "/volumes/detail":
            response = await getOpenstackVolumeApi(path);
            break;

         case "/v2/images":
            response = await getOpenstackImageApi(path);
            break;

         case "/v2.0/security-groups":
         case "/v2.0/security-group-rules":
         case "/v2.0/ports":
            response = await getOpenstackNetworkApi(path);
            break;

         default:
            throw new Error(`Unhandled path: ${path}`);
      }
      return { content: [{ type: "text", text: response }] };
   },
);

server.tool(
   "conoha_openstack_get_id",
   `
   * EN: Perform ConoHa contract-bound operations via the OpenStack API.
   *      • Argument ‘path’ selects the resource to call.
   *      • Only the following paths are allowed:
   *           /ips                         (list IP addresses associated with the server) 
   *           /os-security-groups          (list security groups associated with the server)
   *           /rrd/cpu                     (server CPU usage statistics)
   *           /rrd/disk                    (server Disk usage statistics)
   *           /v2.0/security-groups        (security group detail)
   *           /v2.0/security-group-rules   (security group rules detail)
   *      • Argument ‘id’ specifies the ID.
   *           /ips, /os-security-groups, /rrd/cpu, /rrd/disk: server_id
   *           /v2.0/security-groups: security_group_id
   *           /v2.0/security-group-rules: security_group_rule_id
   *      • Use strictly for server management or other actions tied to an active contract.
   *
   * JA: ConoHa の OpenStack API を利用してサーバー操作を行います。
   *      • 引数 ‘path’ でアクセス先リソースを指定
   *      • 利用可能パス: /ips, /os-security-groups, /rrd/cpu, /rrd/disk, /v2.0/security-groups, /v2.0/security-group-rules
   *      • 引数 ‘id’ で必要なidを指定
   *           /ips, /os-security-groups, /rrd/cpu, /rrd/disk: サーバーID
   *           /v2.0/security-groups: セキュリティグループID
   *           /v2.0/security-group-rules: セキュリティグループルールID
   *      • 契約に紐づくサーバー管理用途にのみ使用可
   `,
   {
      path: z.enum([
         "/ips",
         "/os-security-groups",
         "/rrd/cpu",
         "/rrd/disk",
         "/v2.0/security-groups",
         "/v2.0/security-group-rules",
      ]),
      id: z.string(),
   },
   async ({ path, id }) => {
      let response: string;

      switch (path) {
         case "/ips":
         case "/os-security-groups":
         case "/rrd/cpu":
         case "/rrd/disk":
            response = await getOpenstackComputeApiId(path, id);
            break;

         case "/v2.0/security-groups":
         case "/v2.0/security-group-rules":
            response = await getOpenstackNetworkApiId(path, id);
            break;

         default:
            throw new Error(`Unhandled path: ${path}`);
      }
      return { content: [{ type: "text", text: response }] };
   },
);

server.tool(
   "conoha_openstack_post_requestbody",
   `
   * EN: Perform ConoHa contract-bound operations via the OpenStack API.
   *      • Argument ‘path’ selects the resource to call.
   *      • Only the following paths are allowed:
   *           /volumes                   (create volume)
   *           /servers                   (create server)
   *           /v2.0/security-groups      (create security group)
   *           /v2.0/security-group-rules (create security group rule)
   *      • The adminPass must be specified by the user when creating a server. It must not be set automatically.
   *      • For security group rules using the tcp or udp protocol, the port_range_min and port_range_max values must be specified by the user. It must not be set automatically.
   *      • Argument ‘requestBody’ specifies the request body.
   *      /servers: 
   *      {
   *       "server": {
   *        "flavorRef": string,             // Flavor ID
   *        "adminPass": "undefined",             // Admin/root password for the server: Must be specified by the user. Do not set automatically.
   *        "block_device_mapping_v2": [     // One or more volume mappings
   *         {
   *          "uuid": string                 // Volume UUID to boot from
   *         }
   *        ],
   *        "metadata": {
   *         "instance_name_tag": string     // Display name of the server
   *        },
   *         "security_groups": [            // List of security groups (optional)
   *          {
   * 			   "name": string                // Name of the security group
   * 		     }
   * 		    ]
   *       }
   *      }
   * 
   *      /volumes:
   *      {
   * 	     "volume": {
   * 		   "size": number,                 // Size of the volume in GB (30, 100, 200, 500, 1000, 5000, 10000)
   * 		   "description": string,          // Description of the volume (nullable)
   * 		   "name": string,                 // Name of the volume
   * 		   "volume_type": string,          // Type of the volume (name or ID)
   * 		   "imageRef": string              // Image ID to create the volume from
   * 	     }
   *      }
   * 
   *      /v2.0/security-groups:
   * 	    {
   * 	     "security_group": {
   * 	      "name": string,                 // Name of the security group
   * 	      "description": string            // Description of the security group (optional)
   * 	     }
   * 	    }
   * 
   *      /v2.0/security-group-rules:
   * 	    {
   * 	     "security_group_rule": {
   * 	      "security_group_id": string,    // ID of the security group
   * 	      "direction": "ingress" | "egress", // Direction of the rule (ingress or egress)
   * 	      "ethertype": "IPv4" | "IPv6",    // Ethertype (IPv4 or IPv6)
   * 	      "port_range_min": number,        // Minimum port range (optional): Must be specified by the user. Do not set automatically.
   * 	      "port_range_max": number,        // Maximum port range (optional): Must be specified by the user. Do not set automatically.
   * 	      "protocol": "tcp" | "udp" | "icmp" | null, // Protocol (optional)
   * 	      "remote_ip_prefix": string,      // CIDR for remote IP (optional)
   * 	      "remote_group_id": string        // ID of the remote security group (optional)
   * 	     }
   *      }
   *      • Use strictly for server management or other actions tied to an active contract.
   *
   * JA: ConoHa の OpenStack API を利用してサーバー操作を行います。
   *      • 引数 ‘path’ でアクセス先リソースを指定
   *      • 利用可能パス: /volumes, /servers, /v2.0/security-groups, /v2.0/security-group-rules
   *      • サーバー作成時の adminPass はユーザーが指定する必要があります。自動設定しないでください。
   *      • セキュリティグループルールの tcp または udp プロトコルを使用する場合、port_range_min と port_range_max の値はユーザーが指定する必要があります。自動設定しないでください。
   *      • 引数 ‘requestBody’ でリクエストボディを指定
   *      • 契約に紐づくサーバー管理用途にのみ使用可
   `,
   {
      path: z.enum([
         "/servers",
         "/volumes",
         "/v2.0/security-groups",
         "/v2.0/security-group-rules",
      ]),
      requestBody: z.union([
         CreateServerRequestSchema,
         CreateVolumeRequestSchema,
         CreateSecurityGroupRequestSchema,
         CreateSecurityGroupRuleRequestSchema,
      ]),
   },
   async ({ path, requestBody }) => {
      let response: string;

      switch (path) {
         case "/servers":
            response = await postOpenstackComputeApiRequestBody(path, requestBody);
            break;

         case "/volumes":
            response = await postOpenstackVolumeApiRequestBody(path, requestBody);
            break;

         case "/v2.0/security-groups":
         case "/v2.0/security-group-rules":
            response = await postOpenstackNetworkApiRequestBody(path, requestBody);
            break;

         default:
            throw new Error(`Unhandled path: ${path}`);
      }
      return { content: [{ type: "text", text: response }] };
   },
);

server.tool(
   "conoha_openstack_post_put_requestbody_id",
   `
   * EN: Perform ConoHa contract-bound operations via the OpenStack API.
   *      • Argument ‘path’ selects the resource to call.
   *      • Only the following paths are allowed:
   *           /action               (server action)
   *           /remote-consoles      (remote console)
   *           /v2.0/security-groups (update security group)
   *           /volumes              (update volume)
   *           /v2.0/ports           (update port)
   *      • Argument ‘id’ specifies the ID.
   *           /action, /remote-consoles: server_id
   *           /v2.0/security-groups: security_group_id
   *           /volumes: volume_id
   *           /v2.0/ports: port_id
   *      • Argument ‘requestBody’ specifies the request body.
   *      /action:
   * 	    {
   * 	     "os-start": null,                // Start the server
   *      }
   *      or
   * 	    { 
   *       "os-stop": null,                 // Stop the server
   *      }
   * 	    or
   * 	    {
   *       "os-stop": {				          // Stop the server
   *        "force_shutdown": true | false   // Force shutdown
   * 	     }
   * 	    }
   * 	    or
   * 	    {
   * 	     "os-reboot": {                   // Reboot the server
   * 	      "type": "SOFT" | "HARD"         // Reboot type (soft or hard)
   * 	     }
   * 	    }
   * 	    or
   * 	    {
   *       "resize": {                  // Resize the server
   * 	      "flavorRef": string             // Flavor ID to resize to
   * 	     }
   * 	    }
   * 	    or
   * 	    {
   *       "confirmResize": null,          // Confirm the resize
   * 	    }
   * 	    or
   * 	    {
   * 	     "revertResize": null,            // Revert the resize
   *      }
   * 
   * 	    /remote-consoles:
   * 	    {
   * 	     "remote_console": {
   * 	      "protocol": "vnc" | "spice" | "serial", // Protocol for the remote console
   * 	      "type": "novnc" | "serial"             // Type of the remote console
   * 	     }
   * 	    }
   * 
   *      /v2.0/security-groups:
   * 	    {
   * 	     "security_group": {
   * 	      "name": string,                 // Name of the security group (optional)
   * 	      "description": string            // Description of the security group (optional)
   * 	     }
   * 	    }
   * 
   *      /volumes:
   *  	 {
   * 	     "volume": {
   * 		   "name": string,                 // Name of the volume (optional)
   * 		   "description": string            // Description of the volume (optional)
   * 	     }
   * 	    }
   * 
   *      /v2.0/ports:
   *      {
   *       "port": {
   *        "security_groups": [string]       // List of security group IDs to associate with the port (optional)
   *       }
   *      }
   *      • Use strictly for server management or other actions tied to an active contract.
   *
   * JA: ConoHa の OpenStack API を利用してサーバー操作を行います。
   *      • 引数 ‘path’ でアクセス先リソースを指定
   *      • 利用可能パス: /action, /remote-consoles, /v2.0/security-groups, /volumes, /v2.0/ports
   * 	    • 引数 ‘id’ で必要なidを指定
   * 	         /action, /remote-consoles: サーバーID
   *           /v2.0/security-groups: セキュリティグループID
   *           /volumes: ボリュームID
   *           /v2.0/ports: ポートID
   *      • 引数 ‘requestBody’ でリクエストボディを指定
   *      • 契約に紐づくサーバー管理用途にのみ使用可
   `,
   {
      path: z.enum([
         "/action",
         "/remote-consoles",
         "/v2.0/security-groups",
         "/volumes",
         "/v2.0/ports",
      ]),
      id: z.string(),
      requestBody: z.union([
         OperateServerRequestSchema,
         RemoteConsoleRequestSchema,
         UpdateSecurityGroupRequestSchema,
         UpdateVolumeRequestSchema,
         UpdatePortRequestSchema,
      ]),
   },
   async ({ path, id, requestBody }) => {
      let response: string;

      switch (path) {
         case "/action":
         case "/remote-consoles":
            response = await postOpenstackComputeApiRequestBody1Id(
               path,
               id,
               requestBody,
            );
            break;

         case "/v2.0/security-groups":
         case "/v2.0/ports":
            response = await putOpenstackNetworkApiRequestBody1Id(
               path,
               id,
               requestBody,
            );
            break;

         case "/volumes":
            response = await putOpenstackVolumeApiRequestBody1Id(
               path,
               id,
               requestBody,
            );
            break;

         default:
            throw new Error(`Unhandled path: ${path}`);
      }
      return { content: [{ type: "text", text: response }] };
   },
);

server.tool(
   "conoha_openstack_delete_id",
   `
   * EN: Perform ConoHa contract-bound operations via the OpenStack API.
   *      • Argument ‘path’ selects the resource to call.
   *      • Only the following paths are allowed:
   *           /servers                   (delete server)
   *           /v2.0/security-groups      (delete security group)
   *           /v2.0/security-group-rules (delete security group rule)
   *           /volumes                   (delete volume)
   *      • Argument ‘id’ specifies the ID.
   *           /servers: server_id
   *           /v2.0/security-groups: security_group_id
   *           /v2.0/security-group-rules: security_group_rule_id
   *           /volumes: volume_id
   *      • Use strictly for server management or other actions tied to an active contract.
   *
   * JA: ConoHa の OpenStack API を利用してサーバー操作を行います。
   *      • 引数 ‘path’ でアクセス先リソースを指定
   *      • 利用可能パス: /servers, /v2.0/security-groups, /v2.0/security-group-rules, /volumes
   *      • 引数 ‘id’ で必要なidを指定
   *           /servers: サーバーID
   *           /v2.0/security-groups: セキュリティグループID
   *           /v2.0/security-group-rules: セキュリティグループルールID
   *           /volumes: ボリュームID
   *      • 契約に紐づくサーバー管理用途にのみ使用可
   `,
   {
      path: z.enum([
         "/servers",
         "/v2.0/security-groups",
         "/v2.0/security-group-rules",
         "/volumes",
      ]),
      id: z.string(),
   },
   async ({ path, id }) => {
      let response: string;

      switch (path) {
         case "/servers":
            response = await deleteOpenstackComputeApiId(path, id);
            break;

         case "/v2.0/security-groups":
         case "/v2.0/security-group-rules":
            response = await deleteOpenstackNetworkApiId(path, id);
            break;

         case "/volumes":
            response = await deleteOpenstackVolumeApiId(path, id);
            break;

         default:
            throw new Error(`Unhandled path: ${path}`);
      }
      return { content: [{ type: "text", text: response }] };
   },
);

const transport = new StdioServerTransport();
await server.connect(transport);
