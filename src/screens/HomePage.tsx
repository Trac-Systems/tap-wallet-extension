import { Button } from "@mui/material";
import "../css/HomePage.css";
function HomePage() {
  return (
    <div className="MainContent">
      {/* Content */}
      <div className="HomePageContent">
        <div className="HomePageLogo">
          <img src="/src/assets/TapLogo.svg"></img>
        </div>

        <p className="HomePageContent_Introduce">
          TAP wallet allows you to make fast and secure blockchain-based
          payments without intermediaries.
        </p>
      </div>

      {/* Buttons */}
      <div className="HomePageBtn">
        <Button className="CommonBtn CommonBtn_Primary" variant="contained">Create New Wallet</Button>
        <Button className="CommonBtn CommonBtn_Secondary" variant="contained">Import Existing Wallet</Button>
      </div>
    </div>
  );
}

export default HomePage;
