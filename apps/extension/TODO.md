# TODO

Extension Requirements

1. Add a "Copy PR" button to the github & graphite website PR pages
2. When clicked, the button copies a rich-text message containing the PR name, repo, PR stats as well as links to github/graphite to the user's clipboard.
3. The extension should allow the user to toggle github/graphite functionality/copying (ie, if graphite is disabled, it doesnt appear in the message)
4. To generate the message, we should use the github API to query the PR. All of the relevant info is available in the PR API
5. When the button is clicked, the button state is updated appropriately.
6. The extension should be implemented as a Github APP and communicate with the API server deployed in the /web app.
7. The API server should only mint tokens for use in the extension. All other user settings can be stored locally in the extension itself.
8. The web app should have a dead-simple landing page explaining the project.

Future considerations

1. Add support for personal access token input instead of using the github app flow (for use when someone cannot install the app)
