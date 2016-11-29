angular.module('starter')
    .service('SocketService',function(SERVER_IP,$localStorage,$rootScope,$window,$ionicPopup){
        this.everConnected=false;
        var self=this;
        this.initsocket=function(){
            if(self.everConnected){
                return;
            }
            self.everConnected=true;
            var stompClient;
            var socket = new SockJS(SERVER_IP+'/gs-guide-websocket');
            stompClient = Stomp.over(socket);
            stompClient.heartbeat.outgoing = 5;
            self.stompClient=stompClient;
            stompClient.connect({}, function (frame) {
                self.everConnected=true;
                console.log('socket js Connected: ' + frame);
                stompClient.subscribe('/topic/'+$localStorage.subscriber.name, function (greeting) {
                    console.log('receiving socket js messagge ');
                    console.log(greeting);
                    $rootScope.$broadcast("threshold_reached",JSON.parse(greeting.body));

                },{ id: $localStorage.subscriber.name });

                stompClient.subscribe('/topic/temperature', function (greeting) {
                    $rootScope.$broadcast("temperature",greeting.body);
                });

                var windowElement = angular.element($window);
                windowElement.on('beforeunload', function (event) {
                    // do whatever you want in here before the page unloads.
                    stompClient.disconnect(function() {
                        console.log('disconnected from websocket');
                    });

                });

            },function(){
                self.everConnected=false;
                if(self.intent_disconnect){
                    self.intent_disconnect=false;
                    return;
                }
                var confirmPopup = $ionicPopup.confirm({
                    title: 'Server Disconnected',
                    template: 'Do you want to reconnect?'
                });

                confirmPopup.then(function(res) {
                    if(res) {
                        self.initsocket();
                    }else{
                       // self.closesocket();
                        self.intent_disconnect=true;
                    }
                });
            });
        }

        this.closesocket=function(){
            self.intent_disconnect=true;
            self.everConnected=false;
            self.stompClient.disconnect(function() {
                console.log('disconnected from websocket');
            });
        }
    });
