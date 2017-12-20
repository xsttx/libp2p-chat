const program = require('commander');
const PeerId = require('peer-id');
const PeerInfo = require('peer-info');
const Storage = require('node-storage');
const LibP2PBundle = require('./LibP2PBundle');
const FloodSub = require('libp2p-floodsub');

const store = new Storage('data/store');

program
    .version('0.0.1')
    .command('ids:new <name>')
    .action(function (name) {

        PeerId.create({ bits: 1024 }, (err, id) => {

            if (err) { throw err }

            const jsonId = id.toJSON();

            store.put(`ids.${name}`, JSON.stringify(jsonId, null, 2));

            console.log(`Added: '${jsonId.id}'`);

        });

    });

program
    .command('ids:list')
    .action(function () {

        const ids = store.get('ids');

        if(!ids){
            return console.log('There are no ids present');
        }

        Object.keys(ids).map(function (index) {

            const id = JSON.parse(ids[index]);

            console.log(`Name: '${index}' | Id: ${id.id}`);
        })

    });

program
    .command('friends:add <name> <peer-id>')
    .action(function (name, peerId) {

        store.put(`friends.${name}`, peerId);

        console.log(`Saved friend: '${name}'`);

    });

program
    .command('friends:list')
    .action(function () {

        const friends = store.get('friends');

        if(!friends){
            return console.log('There are no friends present');
        }

        Object.keys(friends).map(function (index) {
            console.log(`Name: '${index}' | Id: ${friends[index]}`);
        })

    });

program
    .command('chat <id-name> <friend>')
    .action(function (idName, friend) {

        const id = JSON.parse(store.get('ids.'+idName));
        const f = store.get('friends.'+friend);

        if(!id){
            throw new Error(`Couldn't find id: '${idName}'`);
        }

        if(!f){
            throw new Error(`Couldn't find friend: '${friend}'`);
        }

        console.log('-----------------------------------------------------------');
        console.log("Starting chat with personal id: "+id.id);

        /**
         * CREATE MY NODE
         */

        const myTopic = `${id.id}|${f}`;
        const friendTopic = `${f}|${id.id}`;

        process.stdin.setEncoding('utf8');

        PeerId.createFromJSON(id, (err, myPeerId) => {

            if(err){
                throw err;
            }

            PeerInfo.create(myPeerId, (err, peerInfo) => {

                if(err){
                    throw err;
                }

                peerInfo.multiaddrs.add('/ip4/0.0.0.0/tcp/0');

                const me = new LibP2PBundle(peerInfo);

                me.start(function (err) {

                    if(err){
                        throw err;
                    }

                    me.on('peer:discovery', (peer) => {
                        me.dial(peer, () => {});
                    });

                    me.on('peer:connect', (peer) => {

                        if(peer.id.toB58String() === f){
                            console.log("Connected to friend");
                        }

                    });

                    const fSub = new FloodSub(me);

                    fSub.start((err) => {

                        if (err) {
                            throw err;
                        }

                        fSub.on(myTopic, (data) => {
                            console.log(`From ${friend}: ${data.data.toString()}`);
                        });

                        fSub.subscribe(myTopic);

                        process.stdin.on('data', function (text) {
                            console.log(`Me: ${text}`);
                            fSub.publ
                            fSub.publish(friendTopic, text);
                        });

                    });

                    //Friend
                    PeerId.createFromJSON({id: f}, (err, peerId) => {

                        PeerInfo.create(peerId, (err, peerInfo) => {

                            const i = setInterval(function () {

                                if(me.isConnected()){

                                    me.peerRouting.findPeer(peerInfo.id, (error, peer) => {

                                        if(error){
                                            throw error;
                                        }

                                        //@Todo why is connection 0
                                        me.dial(peer, (err, connection) => {

                                            if(err){
                                                throw new Error();
                                            }

                                        })

                                    });

                                    clearInterval(i);

                                }


                            }, 1000);


                        })

                    })

                })

            })

        });


    });

program.parse(process.argv);
