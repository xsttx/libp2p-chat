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

                    me.peerRouting.findPeer(f, (err, peerInfo) => {

                        if(err){
                            throw err;
                        }

                        me.dial(peerInfo, () => {
                            console.log("Found friend");
                        })

                    });

                    const fsub = new FloodSub(me);

                    fsub.start((err) => {

                        if (err) {
                            throw err;
                        }

                        fsub.on(myTopic, (data) => {
                            console.log(`From ${friend}: ${data.data.toString()}`);
                        });

                        fsub.subscribe(myTopic);

                        process.stdin.on('data', function (text) {
                            console.log(`Me: ${text}`);
                            fsub.publish(friendTopic, text);
                        });

                    })

                })

            })

        });


    });

program.parse(process.argv);
