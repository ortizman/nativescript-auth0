"use strict";
var auth0Module = require("nativescript-auth0");
function getAuthLock() {
    return new auth0Module.Auth0Lock({
        clientId: 'q5atQzi6DgmWBpHWRJbd7MBNa5eLBPRp',
        domain: 'nativescript.auth0.com',
    });
}
exports.getAuthLock = getAuthLock;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImhlbHBlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGdEQUFrRDtBQUdsRDtJQUNJLE1BQU0sQ0FBQyxJQUFJLFdBQVcsQ0FBQyxTQUFTLENBQUM7UUFDN0IsUUFBUSxFQUFFLGtDQUFrQztRQUM1QyxNQUFNLEVBQUMsd0JBQXdCO0tBRWxDLENBQUMsQ0FBQztBQUNQLENBQUM7QUFORCxrQ0FNQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGF1dGgwTW9kdWxlIGZyb20gXCJuYXRpdmVzY3JpcHQtYXV0aDBcIjtcblxuLy9TaW5nbGUgcG9pbnQgb2YgZW50cnkgdG8gZ2V0IHRoZSBMb2NrIG9iamVjdCwgb25seSBoYXZlIHRvIHNldCB0aGUga2V5cyBvbmNlXG5leHBvcnQgZnVuY3Rpb24gZ2V0QXV0aExvY2soKTogYXV0aDBNb2R1bGUuQXV0aDBMb2Nre1xuICAgIHJldHVybiBuZXcgYXV0aDBNb2R1bGUuQXV0aDBMb2NrKHtcbiAgICAgICAgY2xpZW50SWQ6ICdxNWF0UXppNkRnbVdCcEhXUkpiZDdNQk5hNWVMQlBScCcsXG4gICAgICAgIGRvbWFpbjonbmF0aXZlc2NyaXB0LmF1dGgwLmNvbScsXG4gICAgICAgIC8vc2NvcGU6IFtcIm9mZmxpbmVfYWNjZXNzIG9wZW5pZFwiXVxuICAgIH0pO1xufSJdfQ==