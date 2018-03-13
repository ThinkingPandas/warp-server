# Warp Server

__Warp Server__ is an `express` middleware that implements an easy-to-use API for managing and querying data from your database.

Currently, `Warp Server` uses `mysql@5.7` as its database of choice, but can be extended to use other data storage providers.

> NOTE: This readme is being updated for version 5.0.0. For the legacy version (i.e. versions < 5.0.0), see [readme-legacy.md](readme-legacy.md)

# Table of Contents
- **[Installation](#installation)**  
- **[Configuration](#configuration)**
    - **[Configuration Options](#configuration-options)**
- **[Models](#models)**
    - **[Creating a Model](#creating-a-model)**
    - **[Using an Alias](#using-an-alias)**
    - **[Adding the Model](#adding-the-model)**
    - **[Using Pointers](#using-pointers)**
    - **[Defining Key Types](#defining-key-types)**
    - **[Setters and Getters](#setters-and-getters)**
- **[Authentication](#auth)**
    - **[Creating a User model](#creating-a-user-model)**
    - **[Creating a Session model](#creating-a-session-model)**
    - **[Setting the Auth models](#setting-the-auth-models)**

# Installation

To install Warp Server, simply run the following command:

```javascript
npm install --save warp-server
```

# Configuration

Warp Server is built on top of `express` and can be initialized in any `express` project. To do so, simply add the following configruation to the main file of your project:

```javascript
// References
import express from 'express';
import WarpServer from 'warp-server';

// Create a new Warp Server API
var api = new WarpServer({
    apiKey: 'someLongAPIKey123',
    masterKey: 'someLongMasterKey456',
    databaseURI: 'mysql://youruser:password@yourdbserver.com:3306/yourdatabase'
});

// Initialize the api
api.initialize();

// Apply the Warp Server router to your preferred base URL
var app = express();
app.use('/api/1', api.router);
```
## Configuration Options

Warp Server accepts several configuration options that you can fully customize.

| Name              | Description                                                                          |
| ----------------- | ------------------------------------------------------------------------------------ |
| apiKey            | API key for your Warp Server (required)                                              |
| masterKey         | Master key for your Warp Server (required)                                           |
| databaseURI       | URI of your database (protocol://user:password@server:port/database)                 |
| requestLimit      | Number of requests allowed per second (default: 30)                                  |
| sessionDuration   | Validity duration of a logged in user's session (default: '2 years')                 |
| keepConnections   | Determine whether db pool connections are kept alived or auto-disconnected (boolean) |
| charset           | Charset encoding of database queries (default: 'utf8mb4_unicode_ci')                 |
| passwordSalt      | Customize the password salt for log-ins (default: 8)                                 |
| customResponse    | Determine whether the response is going to be handled manually or automatically      |
| supportLegacy     | Support legacy features such as `className` instead of `class_name`                  |

# Models

A `Model` is a representation of a schema inside a database. It holds all of the logic that has to do with storing and retrieving data from its corresponding table. By defining a model, you can determine how fields, known as `Keys` in Warp, are parsed and formatted.

## Creating a Model

To create a Model, create a new class which extends from `Model.Class`.

```javascript
// Import Model from WarpServer
import { Model } from 'warp-server';

class Dog extends Model.Class {

    static get className() {
        return 'dog';
    }

    static get keys() {
        return ['name', 'age', 'weight'];
    }
}
```

From the example above you can see a couple of properties that you need to declare in order for your Model to work. 

First, you need to declare the table that the Model is representing. For this, you create a static getter called `className` that returns the name of the table. Then, you need to decalre the Keys that the table is composed of. For that, you create a static getter called `keys`, which returns an array of their names.

Among these `Keys` are three special ones that are automatically set by the server and cannot be manually edited.

- `id`: a unique identifier that distinguishes an object inside a table
- `created_at`: a timestamp that records the date and time when an object was created (UTC)
- `updated_at`: a timestamp that records the date and time when an object was last modified (UTC)

If this were shown as a table, it would look similar to the following.

Table: __Dog__
| id  | name     | age      | weight       | created_at          | updated_at          |
| --- | -------- | -------- | ------------ | ------------------- | ------------------- |
| 1   | Bingo    | 4        | 33.2         | 2018-03-09 12:38:56 | 2018-03-09 12:38:56 |
| 2   | Ringo    | 5        | 36           | 2018-03-09 12:38:56 | 2018-03-09 12:38:56 |

## Using an Alias

If you need to make an alias for your table in situations where the table name is not suitable, you can define the alias as the `className` and then declare a static getter `source` returning the real name of the table.

```javascript
// Import Model from Warp Server
import { Model } from 'warp-server';

class Bird extends Model.Class {

    static get className() {
        return 'bird';
    }

    static get source() {
        return 'avian';
    }

    static get keys() {
        return ['name', 'age', 'weight'];
    }
}
```

## Adding the Model

Right now, the Model you created is still not recognized by your Warp Server. To register its definition, use `.models.add()`.

```javascript
// Add the Dog model
api.models.add({ Dog });

// Apply the router after
app.use('/api/1', api.router);
```

`.models.add()` accepts a mapping of Models, so you can do the following.

```javascript
// Add multiple models
api.models.add({ Dog, Bird });

// Apply the router after
app.use('/api/1', api.router);
```

Now that you've added the Models, once you start the server, you can begin accessing them via the `/classes` endpoint.

```bash
> curl -H 'X-Warp-API-Key=1234abcd' http://localhost:3000/api/1/classes/dog

{
    result: [
        {
            id: 1,
            name: "Bingo",
            age: 4,
            weight: 33.2,
            created_at: "2018-03-09T12:38:56.000Z",
            updated_at: "2018-03-09T12:38:56.000Z"
        },
        {
            id: 2,
            name: "Ringo",
            age: 5,
            weight: 36,
            created_at: "2018-03-09T12:38:56.000Z",
            updated_at: "2018-03-09T12:38:56.000Z"
        }
    ]
}
```

For more information about endpoints, visit the [Endpoints](#endpoints) section.

## Using Pointers

For relational databases like MySQL, a foreign key is a fairly common concept. It basically represents a link to another table that acts as its parent.

For example, a `dog` table can have a `location_id` foreign key that points to the `location` table. In terms of Warp, this would mean that the `dog` model would have a pointer to the `location` model.

You can declare these Pointers under the static getter `keys`.

```javascript
// Import Model from WarpServer
import { Model } from 'warp-server';

class Location extends Model.Class {

    static get className() {
        return 'location';
    }

    static get keys() {
        return ['city', 'country'];
    }
}

class Dog extends Model.Class {

    static get className() {
        return 'dog';
    }

    static get keys() {
        return ['name', 'age', 'weight', Location.as('location')];
    }
}
```

In the above example, you can see that a new `key` has been added to `dog`, called `location`. We use the extended model `Location` in order to create a new key via the `.as()` method. This means that for our endpoints, we can now interact with the `dog`'s location using the alias `location`.

For more information about endpoints, visit the [Endpoints](#endpoints) section.

### Secondary Pointers

If you also want to include a pointer from another pointer, you can do so via the `.from()` method. For example, if `location` had a pointer to a `country` model, and you want to include that to your `dog` model, you would do the following.

```javascript
// Import Model from WarpServer
import { Model } from 'warp-server';

class Country extends Model.Class {

    static get className() {
        return 'country';
    }
}

class Location extends Model.Class {

    static get className() {
        return 'location';
    }

    static get keys() {
        return ['city', Country.as('country')];
    }
}

class Dog extends Model.Class {

    static get className() {
        return 'dog';
    }

    static get keys() {
        return [
            'name', 
            'age', 
            'weight', 
            Location.as('location'), 
            Country.as('country').from('location.country')
        ];
    }
}
```

> NOTE: Make sure the secondary pointer is declared after its source pointer

Now that you've defined the secondary pointer, you can now retrieve it via the endpoints. Note that you cannot manually set the value of a secondary pointer, you can only retrieve it.

## Defining Key Types

By default, Warp tries to save the values that you passed to the keys as-is. That means that there is no validation or parsing being done before it is sent to the database. In some cases, this would be fine. However, you may opt to define the keys' data types.

To define key types, use the `Key()` function from Warp Server.

```javascript
// Import Model and Key from WarpServer
import { Model, Key } from 'warp-server';

class Dog extends Model.Class {

    static get className() {
        return 'dog';
    }

    static get keys() {
        return ['name', Key('age').asNumber(1, 50), Key('weight').asFloat(2)];
    }
}
```

### Data Types

+ `asString`(minLength?: number, maxLength?: number)
    - Declare the key as a string

+ `asDate`()
    - Declare the key as a date

+ `asNumber`(min?: number, max?: number)
    - Declare the key as a number
    - Allows you to use `Increment` instead of an actual number when setting its value

+ `asFloat`(decimals?: number, min?: number, max?:number)
    - Declare the key as a float
    - Allows you to use `Increment` instead of an actual number when setting its value

+ `asJSON`()
    - Declare the key as a JSON object (only available on MySQL 5.7+)
    - Allows you to use `JsonSet` instead of an actual object when setting its value
    - Allows you to use `JsonAppend` instead of an actual object when setting its value

For more information about specials (`Increment`, `JsonSet`, `JsonAppend`), visit the [Special Values](#special-values) section.

## Setters and Getters

If the provided Key types are not suitable for your needs, you can opt to manually define setters and getters for your keys. 

To define a setter, simply use the `camelCase` version of the key as its name.

```javascript
// Import Model from WarpServer
import { Model } from 'warp-server';

class Dog extends Model.Class {

    static get className() {
        return 'dog';
    }

    static get keys() {
        return ['name', 'age', 'weight', 'dog_years'];
    }

    set dogYears(value) {
        if(value.length < 5)
            throw new Error('Dog years must be at least 5');

        this.set('dog_years', value);
    }
}
```

From the above example, you can see that you can throw an error when a value is not valid. Also, you can use the pre-built `.set()` method in order to set the value for the Object. Without it, the value will not be saved in the database.

Similar to the setter, you can define a getter by simply using the `camelCase` version of the key as its name.

```javascript
// Import Model from WarpServer
import { Model } from 'warp-server';

class Dog extends Model.Class {

    static get className() {
        return 'dog';
    }

    static get keys() {
        return ['name', 'age', 'weight', 'dog_years'];
    }

    set dogYears(value) {
        if(value < 5)
            throw new Error('Dog years must be at least 5');

        this.set('dog_years', value);
    }

    get dogYears() {
        return this.get('dog_years') + ' years';
    }
}
```

By using the `.get()` method, you can retrieve the data that was stored and present it back to the response in a different format.

# Authentication

User authentication is a common concern for applications. Luckily, for Warp Server, this comes built-in. Aside from regular models, there are two other special models that make up the authentication layer of Warp.

## Creating a User model

A `User` represents individual people who log in and make requests to the server. To enable this feature, you would need to declare a new class which extends from `User.Class`.

```javascript
// Import User from WarpServer
import { User as WarpUser } from 'warp-server';

class User extends WarpUser.Class {

    static get className() {
        return 'user';
    }

}
```

By default, the User model already has pre-defined keys that are important for it to function properly.

- `username`: A unique identifier created by the user
- `email`: A unique email identified for the user
- `password`: An encrypted string that gets stored and validated during log-ins

These keys are required and your table must have columns defined for each. If, however, you declared these fields with different names in your table, you can opt to declare their corresponding names via the following methods.

```javascript
// Import User from WarpServer
import { User as WarpUser } from 'warp-server';

class User extends WarpUser.Class {

    static get className() {
        return 'user';
    }

    static get usernameKey() {
        return 'unique_name';
    }

    static get emailKey() {
        return 'email_address';
    }

    static get passwordKey() {
        return 'secret_key';
    }
}
```

If you also want to place additional keys from your user table, you can do so by extending the class' `super.keys`.

```javascript
// Import User from WarpServer
import { User as WarpUser } from 'warp-server';

class User extends WarpUser.Class {

    static get className() {
        return 'user';
    }

    static get keys() {
        return [...super.keys, 'first_name', 'last_name', 'display_photo'];

        // If you do not have support for spread operators, use the following:

        // const keys = super.keys; 
        // return keys.concat('first_name', 'last_name', 'display_photo');
    }
}
```

## Creating a Session model

A `Session` represents a successful authentication of a user. They are created every time a user logs in, and destroyed every time they are logged out. For Warp Server, a Session's `sessionToken` is often used to make requests to the server. This sessionToken is validated and returned as the `currentUser` of the request. You can find more about this in the [Sessions](#sessions) section.

To enable this feature, you would need to declare a new class which extends from `Session.Class`.

```javascript
// Import Session from WarpServer
import { Session as WarpSession } from 'warp-server';

class Session extends WarpSession.Class {

    static get className() {
        return 'session';
    }

}
```

By default, like the User model, the Session model already has pre-defined keys that are important for it to function properly.

- `session_token`: A unique token every time a successful login occurs
- `origin`: The origin of the request (`js-sdk`, `android`, `ios`)
- `revoked_at`: Date until the session expires

These keys are required and your table must have columns defined for each. If, however, you declared these fields with different names in your table, you can opt to declare their corresponding names via the following methods.

```javascript
// Import Session from WarpServer
import { Session as WarpSession } from 'warp-server';

class Session extends WarpSession.Class {

    static get className() {
        return 'user';
    }

    static get sessionTokenKey() {
        return 'session_key';
    }

    static get originKey() {
        return 'requested_by';
    }

    static get revokedAtKey() {
        return 'expires_at';
    }
}
```

If you also want to place additional keys from your user table, you can do so by extending the class' `super.keys`.

```javascript
// Import Session from WarpServer
import { Session as WarpSession } from 'warp-server';

class Session extends WarpSession.Class {

    static get className() {
        return 'session';
    }

    static get keys() {
        return [...super.keys, 'ip_address', 'fcm_key'];

        // If you do not have support for spread operators, use the following:

        // const keys = super.keys; 
        // return keys.concat('ip_address', 'fcm_key');
    }
}
```