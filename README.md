## Paymongo Link

A simple API that generates a paymongo link.

### Usage
---
1. Build this container by running this command:
`docker build --tag paymongo-link .`
2. After building the container, you can run it as follow:
`docker run -p 8000:80 paymongo-link`

### Request

#### Generate a paymongo link:

```js
POST http://localhost/links
```

**Params:**

 - **amount** - Total amount in cents. eg: P100 => 10000 cents
 - **description** - The description for this transaction
 - **other_info** - Other info about the transaction.

**Response:**

```json
{
	"data": {
		"id": "ZGoMeEs",
		"type": "transaction",
		"amount": 10000,
		"url": "https://pm.link/xxxx/ZGoMeEs"
	}
}
```
