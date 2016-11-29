angular.module('starter.controllers', [])

    .controller('AppCtrl', function ($rootScope,$scope, $ionicModal, $timeout, $localStorage,$http,$state,SERVER_IP, SocketService) {
        $scope.addNew=function(){
            $state.go('app.newthres');
        }

        $rootScope.$on('$stateChangeStart', function(next, current) {
            $scope.hideplusbtn=(current.name!='app.thresholds');
        });
        function requestNewUser() {
            $scope.page = {
                subscriber_name: null
            }

            $ionicModal.fromTemplateUrl('templates/login.html', {
                scope: $scope
            }).then(function (modal) {
                $scope.modal = modal;
                $scope.modal.show();
            });
            $scope.createSubscr = function () {
                //alert($scope.page.subscriber_name);
                if (!$scope.page.subscriber_name) {
                    alert('enter correct name!');
                    return;
                }
                $http({
                    method: 'POST',
                    url: SERVER_IP+"/api/subscribers",
                    data: {name: $scope.page.subscriber_name}
                }).then(
                    function (res) {
                        $localStorage.subscriber = {
                            name: $scope.page.subscriber_name,
                            thresholds: []
                        }
                        SocketService.initsocket();
                        $scope.modal.hide();
                    },
                    function (err) {
                        console.log(err);
                        alert(err.data.message);
                    }
                );
            };
        }

        if($localStorage.subscriber){
            $http({
                method: 'GET',
                url: SERVER_IP+"/api/subscribers/"+$localStorage.subscriber.name+"/validate"
            }).then(
                function (res) {
                    if(res.data==true) {
                        SocketService.initsocket();
                    }else{
                        requestNewUser();
                    }
                },
                function (err) {
                    console.log(err);
                    alert(err.data.message);
                }
            );
            SocketService.initsocket();
        } else {
            requestNewUser();

        }




    })

    .controller('MonitorCtrl',function($scope,$localStorage,$ionicModal,$rootScope){
        $scope.page={"current_temperature":"N/A","threshold_name":"N/A"};
        $scope.page.hit_thres_list=[];
        $scope.$on('threshold_reached',function(e,t){
            $scope.$apply(function(){
                if(['$no_reached$','N/A'].indexOf(t.threshold_name)<0){
                    $scope.page.hit_thres_list.unshift({thres:t.threshold_name,time:new Date()});
                }
            });
            //console.log("oh wow "+t);
        });

        $scope.$on('temperature',function(e,t){
            $scope.$apply(function(){
                $scope.page.current_temperature=t;
            });
            //console.log("oh wow "+t);
        })

        setInterval(function(){
            if($scope.page.hit_thres_list.length>5){
                while($scope.page.hit_thres_list.length>5)
                    $scope.page.hit_thres_list.splice($scope.page.hit_thres_list.length-1,1);
            }
        },10000);

    })
    .controller('ThresholdsCtrl', function ($scope,$http,$localStorage,$state,SERVER_IP,$rootScope) {
        $scope.$parent.showadd=true;
        $scope.thresholds = [];
        $http({
            method: 'GET',
            url: SERVER_IP+"/api/subscribers/"+$localStorage.subscriber.name+"/thresholds",
        }).then(
            function(res) {
               $scope.thresholds=res.data;
            },
            function(err) {
                console.log(err);
                alert(err.data.message);
            }
        );

        $scope.view=function(t){
            $state.go('app.threshold',{thres:t});
        }
    })

    .controller('ThresholdCtrl', function ($scope, $stateParams,$rootScope) {
        $scope.page={view:true};
        console.log($stateParams.thres)
        $scope.thres=$stateParams.thres;
    })

    .controller('NewThresholdCtrl', function ($scope, $http,$state,$localStorage,SERVER_IP) {
        $scope.thres={};
        $scope.create=function(){
            if(isNaN($scope.thres.value)){
                alert('enter float number in value filed');
                return;
            }
            if(isNaN($scope.thres.fluctuation)){
                alert('enter float number in fluctuation filed');
                return;
            }
            $scope.thres.direction=document.getElementById("direction_select").value;


            $http({
                method: 'POST',
                url: SERVER_IP+"/api/subscribers/"+$localStorage.subscriber.name+"/thresholds",
                data: $scope.thres
            }).then(
                function(res) {
                    $state.go('app.thresholds');
                },
                function(err) {
                    console.log(err);
                    alert(err.data.message);
                }
            );
        }
    });


