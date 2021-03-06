const LibP2P = require('libp2p');
const TCP = require('libp2p-tcp');
const MulticastDNS = require('libp2p-mdns');
const KadDHT = require('libp2p-kad-dht');
const spdy = require('libp2p-spdy');
const secio = require('libp2p-secio');
const Railing = require('libp2p-railing');
const Multiplex = require('libp2p-multiplex');

const bootstrapers = [
    '/ip4/104.131.131.82/tcp/4001/ipfs/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ',
    '/ip4/104.236.176.52/tcp/4001/ipfs/QmSoLnSGccFuZQJzRadHn95W2CrSFmZuTdDWP8HXaHca9z',
    '/ip4/104.236.179.241/tcp/4001/ipfs/QmSoLPppuBtQSGwKDZT2M73ULpjvfd3aZ6ha4oFGL1KrGM',
    '/ip4/162.243.248.213/tcp/4001/ipfs/QmSoLueR4xBeUbY9WZ9xGUUxunbKWcrNFTDAadQJmocnWm',
    '/ip4/128.199.219.111/tcp/4001/ipfs/QmSoLSafTMBsPKadTEgaXctDQVcqN88CNLHXMkTNwMKPnu',
    '/ip4/104.236.76.40/tcp/4001/ipfs/QmSoLV4Bbm51jM9C4gDYZQ9Cy3U6aXMJDAbzgu2fzaDs64',
    '/ip4/178.62.158.247/tcp/4001/ipfs/QmSoLer265NRgSp2LA3dPaeykiS1J6DifTC88f5uVQKNAd',
    '/ip4/178.62.61.185/tcp/4001/ipfs/QmSoLMeWqB7YGVLJN3pNLQpmmEk35v6wYtsMGLzSr5QBU3',
    '/ip4/104.236.151.122/tcp/4001/ipfs/QmSoLju6m7xTh3DuokvT3886QRYqxAzb1kShaanJgW36yx'
];

class LibP2PBundle extends LibP2P {

    constructor (peerInfo) {

        const modules = {
            transport: [
                new TCP(),
            ],
            connection: {
                muxer: [
                    spdy,
                    Multiplex
                ],
                crypto: [
                    secio
                ]
            },
            discovery: [
                new Railing(bootstrapers, {interval: 1000})
            ],
            // DHT is passed as its own enabling PeerRouting, ContentRouting and DHT itself components
            DHT: KadDHT
        };

        super(modules, peerInfo)
    }

    isConnected(){
        return Object.keys(this.peerBook.getAll()).length !== 0;
    }

}

module.exports = LibP2PBundle;
