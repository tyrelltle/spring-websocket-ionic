angular.module('starter.controllers', [])

    .controller('AppCtrl', function ($rootScope,$scope, $ionicModal, $timeout, $localStorage,$http,$state) {
        $scope.addNew=function(){
            $state.go('app.newthres');
        }
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
                    url: "http://localhost:8080/api/subscribers",
                    data: {name: $scope.page.subscriber_name}
                }).then(
                    function (res) {
                        $localStorage.subscriber = {
                            name: $scope.page.subscriber_name,
                            thresholds: []
                        }
                        initsocket();
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
                url: "http://localhost:8080/api/subscribers/"+$localStorage.subscriber.name+"/validate"
            }).then(
                function (res) {
                    if(res.data==true) {
                        initsocket();
                    }else{
                        requestNewUser();
                    }
                },
                function (err) {
                    console.log(err);
                    alert(err.data.message);
                }
            );
            initsocket();
        } else {
            requestNewUser();

        }

        function initsocket(){
            var stompClient;
            var socket = new SockJS('http://localhost:8080/gs-guide-websocket');
            stompClient = Stomp.over(socket);
            stompClient.connect({}, function (frame) {
                console.log('socket js Connected: ' + frame);
                stompClient.subscribe('/topic/'+$localStorage.subscriber.name, function (greeting) {
                    console.log('receiving socket js messagge ');
                    console.log(greeting);
                    $rootScope.$broadcast("temperature",JSON.parse(greeting.body));

                });
            });
        }


    })

    .controller('MonitorCtrl',function($scope,$localStorage,$ionicModal){
        $scope.page={"current_temperature":"N/A","threshold_name":"N/A"};
        $scope.$on('temperature',function(e,t){
            $scope.$apply(function(){

                $scope.page.current_temperature=t.current_temperature;
                $scope.page.threshold_name=t.threshold_name;
            });
            //console.log("oh wow "+t);
        })

    })
    .controller('ThresholdsCtrl', function ($scope,$http,$localStorage,$state) {
        $scope.$parent.showadd=true;
        $scope.thresholds = [];
        $http({
            method: 'GET',
            url: "http://localhost:8080/api/subscribers/"+$localStorage.subscriber.name+"/thresholds",
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

    .controller('ThresholdCtrl', function ($scope, $stateParams) {
        $scope.page={view:true};
        console.log($stateParams.thres)
        $scope.thres=$stateParams.thres;
    })

    .controller('NewThresholdCtrl', function ($scope, $http,$state,$localStorage) {
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
                url: "http://localhost:8080/api/subscribers/"+$localStorage.subscriber.name+"/thresholds",
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


