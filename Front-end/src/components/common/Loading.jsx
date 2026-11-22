function Loading({ message = "Chargement..." }) {
  return (
    <p className="loading-message" role="status">
      {message}
    </p>
  );
}

export default Loading;