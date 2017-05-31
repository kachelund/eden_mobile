/**
 * Sahana Eden Mobile - Resource List Controller
 *
 * Copyright (c) 2016-2017: Sahana Software Foundation
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

"use strict";

// ============================================================================
/**
 * EMResourceList - Resource List Controller
 *
 * @class EMResourceList
 * @memberof EdenMobile
 */
EdenMobile.controller("EMResourceList", [
    '$scope', '$stateParams', 'emResources',
    function($scope, $stateParams, emResources) {

        var addResourceData = function(resourceName) {
            emResources.open(resourceName).then(function(resource) {
                resource.count(function(name, numRows) {
                    $scope.resources.push({
                        name: name,
                        numRows: numRows
                    });
                    $scope.$apply();
                });
            });
        };

        var updateResourceList = function() {
            $scope.resources = [];
            emResources.names().then(function(resourceNames) {
                resourceNames.forEach(function(resourceName) {
                    addResourceData(resourceName);
                });
            });
        };

        // Hide component/lookup resource initially
        $scope.main = true;

        $scope.$on('$ionicView.enter', updateResourceList);
    }
]);

// END ========================================================================
