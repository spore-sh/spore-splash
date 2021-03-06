# Documentation

## Installation

The recommended way to install spore is with the one-line installer below:

```
$ curl https://install.spore.sh | sh
```

Of course, if you'd like to inspect the script prior to piping into `sh`, you can do the following:

```
$ curl https://install.spore.sh > install_spore.sh
$ sh install_spore.sh
```

You can also check out the contents of the installer (along with the server for install.spore.sh) at [spore-sh/spore-install](https://github.com/spore-sh/spore-install).

The installer will install the following components with an interactive script:

1. [spore-cli](https://github.com/spore-sh/spore-cli-node)
2. [spored](https://github.com/spore-sh/spored)

You can install these scripts independently by checking the README's in their repos.

It's important to note that `spored` will attempt to create a daemonized process to run as a background proxy server
between you and the spore pod. This is required to maintain offline functionality. Currently the only automated process
for setting up the daemonized server is for OS X (using `launchd`). On other systems, you'll need to set it up yourself. See [spored](https://github.com/spore-sh/spored) for more information.



## Creating a Spore

To use Spore with an app, you'll need to first create a Spore, which is a local file (`.spore`) as well as a
representation on the server (pod.spore.sh) of your application.

You can create a spore with the following command in your application root:

```
$ spore init
```

Creating a Spore will automatically initialize a few default environments: `development`, `staging`, and `production`.




## Migrating to Spore

### For Heroku Users

In order to make it as simple as possible to migrate to Spore, we've created the Heroku migration script.

To use it, simply use the following command in your application root:

```
$ spore migrate:heroku production
```

That assumes that you have one Heroku app, and that app is your production app. If you have multiple
Heroku apps in your application root, corresponding to different environments, you'll need to specify both.
For example, if I had an app named `spore-staging` on Heroku that corresponded to my staging environment,
I would use the following:

```
$ spore migrate:heroku staging --app spore-staging
```

The Heroku migration is non-destructive. It simply copies your current Heroku environment variables into
a Spore environment, and adds a Spore deployment key to your Heroku app. [Read more about deployments](#creating-deployments).

### Other Migration Scripts

We'd like to add more migration scripts, particularly for popular configuration management tools like
Figaro and Dotenv. To add one, open a pull request to [spore-cli](https://github.com/spore-sh/spore-cli-node).


## Copying Environments

If you just migrated one of your environments to Spore, you're likely going to want to make sure all of that
environment's keys are set in all of your other environments. To do so, use the `spore copy` command:

```
$ spore copy --prompt production
```

That will copy the `production` environment values into your default environment (likely `development`), prompting
you to fill in a value for each key. You can copy all the values by omitting the `--prompt` flag. You can also specify
the target environment with the `-e`, or `--environment flag:

```
$ spore copy -p -e staging production
```


## Setting Environment Variables

To set an environment variable named `MY_VAR` in your existing spore, do the following:

```
$ spore set MY_VAR
```

The `spore-cli` will then prompt you for the value. Spore only accepts `stdin` for values of environment variables
in order to avoid sensitive data from appearing in shell history.

You may have noticed that the command above only set `MY_VAR` in your default environment (which is probably `development`). To set it in a different environment, use the `-e`, or `--environment` flag:

```
$ spore set --environment staging MY_VAR
```

To be prompted for a value for each of your existing environments, use the `-p`, or `--prompt` option:

```
$ spore set --prompt MY_VAR
```

And to set all environments to the same value, use the `-a`, or `--all` option:

```
$ spore set --all MY_VAR
```



## Running An App

The most important thing after setting up your environment variables is running your app so that Spore can load
the saved variables into the environment.


### Using Rails

Use the official [Rails gem](https://github.com/spore-sh/spore-rails) by adding this line to the top of your application's Gemfile:

```
gem 'spore-rails'
```

And then execute:

```
$ bundle
```

See [spore-rails](https://github.com/spore-sh/spore-rails) for important information on load order.


### Using Ruby

Install the official [gem](https://github.com/spore-sh/spore-rails) :

```
$ gem install spore
```

As early as possible in your application bootstrap process:

```
require 'spore'
Spore.load
```

To ensure your environment is loaded in rake, load the tasks:

```
require 'spore/tasks'

task :mytask => :spore do
    # things that require environment to be loaded
end
```


### Using Node.js

Install the official [npm module](https://github.com/spore-sh/spore-node) with:

```
$ npm install --save spore-node
```

Then put the following line in your main javascript file, before any other code:

```
require('spore-node').loadEnvSync();
```


### Using Another Language or Framework

The `spore-cli` has the `run` command, which allows you to run an arbitrary command line program with the Spore
environment variables loaded. If I wanted to run the file `server.py`, I could use the following:

```
$ spore run py server.py
```

`run` takes the `--environment` flag to specify a particular environment to run the program in.


## Reading Environment Variables

Reading environment variables has an almost identical signature to setting environment variables, with the exception
that a key name is not required.

The following gets the value of the variables `MY_VAR` in your default environment (probably `development`):

```
$ spore get MY_VAR
```

And this command will get all of the environment variables for your default environment:

```
$ spore get
```

You can use the `--environment` and `--all` flags just like [`spore set`](#setting-environment-variables).




## Creating New Environments

For Spore, Environments are more like namespaces for the individual environment variables (called cells) rather than objects themselves. As a result, to create one, you just need to set an environment variable in the environment you 
want, and it will spring into existence:

```
$ spore set --environment new_environment MY_VAR
```

See [Setting Environment Variables](#setting-environment-variables) for more information.




## Creating Deployments

Deployments are non-human users that need access to environment variables. A typical deployment would be your
application server. Deployments are limited to accessing a single Spore, and a single environment within that
Spore.

To create a deployment for your `production` environment, use the following:

```
$ spore deployments:create --environment production
```

or the shorter:

```
$ spore deploy -e production
```

You can also pass a name to your deployment to help you distinguish it. Otherwise the `spore-cli` will create a
name for you.

When you create a deployment, the `spore-cli` will return an environment variable named `SPORE_DEPLOYMENT`. This
is the one environment variable that you do need to set manually on your server.

If you use Heroku, you can automate this process by using the [Heroku Migration script](#for-heroku-users).



## Permissions

Spore is made for groups of developers to work on an app together, without exposing app secrets to everyone.
Who can *see* what is managed with permissions, but anyone on your team can *write* variables. But since Spore
is managed using [version control](#version-control), you can make sure nothing nasty ever makes it to production.

### Granting Permissions

If you're working in a team, you'll want to grant some permissions to your team members to be able to collaborate
on your app. To do so, use the following command:

```
$ spore memberships:grant your-friend@example.com
```

or the shorter:

```
$ spore grant your-friend@example.com
```

Like most of the other commands, this will only apply to your default environment (probably `development`).
In most cases, you **should not grant additional permissions to your team**. Spore is designed such that anyone
on your team can *create* environment variables on their local branch, but only those with permissions can read.

That means that everyone on your team can contribute to development without encountering bottlenecks, but without
exposing all of your app secrets to everyone on your team.

The person you invite will receive an email with instructions for installation and acceptance so they can
begin collaborating with you.



### Revoking Permissions

A fact of life when working on development projects is churn. Fortunately with Spore, removing someone from a
project is as easy as revoking their permissions:

```
$ spore memberships:revoke your-friend@example.com
```

or the shorter:

```
$ spore revoke your-friend@example.com
```

You can use the `--all` flag to revoke from all environments at once. If you follow the Spore best practices
of only providing read access to the `development` environment, you likely won't even need to roll your
production and staging secrets!



## Version Control

The `.spore` file contains all of the information about the different environments and environment variables in an app.
Since this file is stored in version control, different branches of your app can have different versions of
environment variables than one another.

When you're working on your branch, there's no need to worry about impacting other developers or a production/staging
environment (even if you modify the `production` or `staging` environment). Your environment variables. will only
show up when your code does.

This also makes it easy to review changes to environment variables. Although the values are hashed, the diffs for
environment variable keys are very effective in flagging important changes to the app.



## Security

### Login Credentials

When you log into Spore, you are actually requesting a new API key from the server. Your old API key will be immediately invalidated when the new one is issued.

Your password is never stored anywere (it's hashed in the database for the Spore Pod), but your API key is stored locally
in your `.netrc` file. If you have reason to believe that file has been compromised, you should immediately issue a
`spore login` command to invalidate the old key. At that point you should check your list of deployments for any additions, and then begin the process of rolling all of your keys.

It's important to note that Spore deployment credentials are not stored anywhere.

### Environment Variable Values

Every environment variable value (called a `cell`) is stored in the `.spore` file in your repository with a hex id.
It's a [UUID v4](http://en.wikipedia.org/wiki/Universally_unique_identifier#Version_4_.28random.29) generated using
the Node.js `crypto.randomBytes`, a cryptographically secure random number generator.

Even if the same value for the same key is set twice, it will receive a new UUID, meaning that knowing the id provides
zero information about the value in the cell.

The actual values are encrypted in transit using SSL, and are encrypted at rest using AES-256-CBC via the [Tomb](https://github.com/spore-sh/tomb) module.

The [Spore Pod](https://github.com/spore-sh/spore-pod), where your values are stored, is 100% open source, and you're welcome to inspect the source for security flaws. Pull Requests and issues regarding security concerns are more than welcome.


## Other Issues

If you have any other issues or questions, you can direct them to the [GitHub issues page for spore-cli](https://github.com/spore-sh/spore-cli-node). If it feels like something that would be better dealt with in private, send us an email at [hello@spore.sh](mailto:hello@spore.sh).
