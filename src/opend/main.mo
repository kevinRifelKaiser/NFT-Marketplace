import Cycles "mo:base/ExperimentalCycles";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import NFTActorClass "../NFT/nft";
import HashMap "mo:base/HashMap";
import List "mo:base/List";


actor OpenD {

    //List of each nft and his owner
    var mapOfNFTs = HashMap.HashMap<Principal, NFTActorClass.NFT>(1, Principal.equal, Principal.hash);
    //List of each owner and a list of all of his nft
    var mapOfOwners = HashMap.HashMap<Principal, List.List<Principal>>(1, Principal.equal, Principal.hash);

    public shared(msg) func mint(imgData: [Nat8], name: Text): async Principal {
        let owner: Principal = msg.caller;

        Debug.print(debug_show(Cycles.balance()));  
        Cycles.add(100_500_000_000);
        let newNFT = await NFTActorClass.NFT(name, owner, imgData);
        Debug.print(debug_show(Cycles.balance()));

        //ID of the canister where the new nfts are hosted on
        let newNFTPrincipal = await newNFT.getCanisterId();

        mapOfNFTs.put(newNFTPrincipal, newNFT);
        addToOwnershipMap(owner, newNFTPrincipal);

        return newNFTPrincipal;

    };

    private func addToOwnershipMap(owner: Principal, nftId: Principal) {
        //List of canister IDs owned from the "owner"
        var ownedNfts: List.List<Principal> = switch (mapOfOwners.get(owner)) {
            case null List.nil<Principal>();
            case (?result) result;
        };

        ownedNfts := List.push(nftId, ownedNfts);
        mapOfOwners.put(owner, ownedNfts);

    };

    public query func getOwnedNFTs(user: Principal): async [Principal] {
        var userNFTs: List.List<Principal> = switch (mapOfOwners.get(user)) {
            case null List.nil<Principal>();
            case (?result) result;
        };
        
        return List.toArray(userNFTs);
    };


};
