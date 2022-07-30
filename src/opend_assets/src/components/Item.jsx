import React, { useEffect, useState } from "react";
import logo from "../../assets/logo.png";
import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory } from "../../../declarations/nft";
import { idlFactory as tokenIdlFactory } from "../../../declarations/token";
import { Principal } from "@dfinity/principal";
import { opend } from "../../../declarations/opend";
import Button from "./Button";
import CURRENT_USER_ID from "../index";
import PriceLabel from "./PriecLabel";

function Item(props) {

  //use state hooks
  const [name, setName] = useState();
  const [owner, setOwner] = useState();
  const [image, setImage] = useState();
  const [button, setButton] = useState();
  const [priceInput, setPriceInput] = useState(); 
  const [loaderHidden, setHidden] = useState(true);
  const [blur, setBlur] = useState();
  const [sellStatus, setSellStatus] = useState("");
  const [priceLabel, setPriceLabel] = useState();


  const id = props.id;

  const localHost = "http://localhost:8080/";
  const agent = new HttpAgent({ host: localHost });

  //Coment or remove the following line when deploy live on ICP
  agent.fetchRootKey();

  let NFTActor;

  async function loadNFT() {
      NFTActor = await Actor.createActor(idlFactory, {
      agent,
      canisterId: id,  
    });

    //Get name
    const name = await NFTActor.getName();
    setName(name);

    //Get owner
    const owner = await NFTActor.getOwner();
    setOwner(owner.toText());   

    //Get image
    const imageData = await NFTActor.getAsset();
    const imageContent = new Uint8Array(imageData);
    const image = URL.createObjectURL(new Blob([imageContent.buffer], {type: "image/png"}));
    setImage(image);

    //Get listed NFT
    if (props.role == "collection") {
      const nftIsListed = await opend.isListed(props.id);
      if (nftIsListed) {
        setBlur({ filter: "blur(4px)" });
        setOwner("OpenD");
        setSellStatus("Listed");
      } else {
        setButton(<Button handleClick={handleSell} text={"Sell"}/>);
      }
    } else if (props.role == "discover") {
      const originalOwner = await opend.getOriginalOwner(props.id);
      if (originalOwner.toText() != CURRENT_USER_ID.toText()) {
        setButton(<Button handleClick={handleBuy} text={"Buy"}/>);
      }

      const price = await opend.getListedNFTPrice(props.id);
      setPriceLabel(<PriceLabel sellPrice={price.toString()} />);
    }
  }

  useEffect(() => {
    loadNFT();
  }, []);

  //Handle sell or buy
  let price;
  function handleSell() {
    console.log("sell clicked");
    setPriceInput(
      <input
        placeholder="Price in DANG"
        type="number"
        className="price-input"
        value={price}
        onChange={(e) => price=e.target.value}
      />
    );
    setButton(<Button handleClick={sellItem} text={"Confirm"}/>);
  }

  //Sell function for My NFTs page
  async function sellItem() {
    setBlur({filter: "blur(4px)"});
    setHidden(false);
    console.log("set price:" + price);
    const listingResult = await opend.listItem(props.id, Number(price));
    console.log("listing: " + listingResult);
    if (listingResult == "Success") {
      const opendId = await opend.getOpenDCanisterId();
      const transferResult = await NFTActor.transferOwnership(opendId);
      console.log("transfer: " + transferResult);
      if (transferResult == "Success"){
        setHidden(true);
        setButton();
        setPriceInput();
        setOwner("OpenD");    
        setSellStatus("Listed");
      }
    }
  }

  //Buy function for Discover page
  async function handleBuy() {
    console.log("Buy was triggered");
    const tokenActor = await Actor.createActor(tokenIdlFactory, {
      agent,
      canisterId: Principal.fromText("tmxop-wyaaa-aaaaa-aaapa-cai"),
    });

    const sellerId = await opend.getOriginalOwner(props.id);
    const itemPrice = await opend.getListedNFTPrice(props.id);

  }

  return (
    <div className="disGrid-item">
      <div className="disPaper-root disCard-root makeStyles-root-17 disPaper-elevation1 disPaper-rounded">
        <img
          className="disCardMedia-root makeStyles-image-19 disCardMedia-media disCardMedia-img"
          src={image}
          style={blur}
        />
        <div hidden={loaderHidden} className="lds-ellipsis">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <div className="disCardContent-root">
          {priceLabel}
          <h2 className="disTypography-root makeStyles-bodyText-24 disTypography-h5 disTypography-gutterBottom">
            {name}<span className="purple-text"> {sellStatus}</span>
          </h2>
          <p className="disTypography-root makeStyles-bodyText-24 disTypography-body2 disTypography-colorTextSecondary">
            Owner: {owner}
          </p>
          {priceInput}
          {button}
        </div>
      </div>
    </div>
  );
}

export default Item;
