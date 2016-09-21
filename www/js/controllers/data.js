/**
 * Sahana Eden Mobile - Data Forms Controllers
 *
 * Copyright (c) 2016: Sahana Software Foundation
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

/**
 * List of forms
 */
EdenMobile.controller("EdenMobileDataForms", [
    '$scope', '$stateParams', function($scope, $stateParams) {
        // pass
    }
]);

/**
 * List of records
 */
EdenMobile.controller("EdenMobileDataList", [
    '$scope', '$stateParams', function($scope, $stateParams) {
        $scope.formName = $stateParams.formName;
    }
]);

/**
 * Create-form
 */
EdenMobile.controller("EdenMobileDataCreate", [
    '$scope', '$stateParams', 'EMDialogs', 'EMDatabase',
    function($scope, $stateParams, EMDialogs, EMDatabase) {
        $scope.formName = $stateParams.formName;

        $scope.master = {firstName: "John", lastName: "Doe"};

        $scope.submit = function(user) {
            $scope.master = angular.copy(user);
            EMDialogs.confirmation('Record created');
        };
        $scope.reset = function() {
            $scope.user = angular.copy($scope.master);
        };
        $scope.reset();
    }
]);

/**
 * Update-form
 */
EdenMobile.controller("EdenMobileDataUpdate", [
    '$scope', '$stateParams', function($scope, $stateParams) {
        $scope.formName = $stateParams.formName;
        $scope.recordID = $stateParams.recordID;
    }
]);