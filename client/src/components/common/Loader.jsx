import "../../styles/loader.css";

function Loader({ text = "Loading..." }) {
  return (
    <div className="loaderContainer">
      <div className="loader" />
      <p style={{ color: "var(--text-secondary, #94a3b8)", fontSize: "0.95rem" }}>{text}</p>
    </div>
  );
}

export default Loader;