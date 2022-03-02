import React from "react";
import "./App.css";

export default function ProgressBar(props) {
  const { bgcolor, completed } = props;

  const containerStyles = {
    height: 40,
    width: "100%",
    backgroundColor: "#e0e0de",
    borderRadius: 50,
    marginTop: 10,
  };

  const fillerStyles = {
    height: "100%",
    width: `${completed}%`,
    transition: "width 1s ease-in-out",
    backgroundColor: bgcolor,
    borderRadius: "inherit",
    textAlign: "right",
  };

  const labelStyles = {
    padding: 10,
    color: "white",
    fontWeight: "bold",
    display: "flex",
    justifyContent: "center",
  };

  return (
    <div style={containerStyles}>
      <div style={fillerStyles}>
        <span style={labelStyles}>processing your wave...</span>
      </div>
    </div>
  );
}
