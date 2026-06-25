import './ScrollIndicator.css';

export default function ScrollIndicator() {
  const handleScrollDown = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    });
  };

  return (
    <div className="scrolldown" onClick={handleScrollDown}>
      <div className="chevrons">
        <div className="chevrondown"></div>
        <div className="chevrondown"></div>
        <div className="chevrondown"></div>
      </div>
    </div>
  );
}
