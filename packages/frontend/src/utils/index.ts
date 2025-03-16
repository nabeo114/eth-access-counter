export const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).then(
    () => {
      alert("Address copied to clipboard!");
    },
    (err) => {
      console.error("Failed to copy address:", err);
    }
  );
};
