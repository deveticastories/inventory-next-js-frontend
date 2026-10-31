import Icon, { type IconName } from "./Icon";

/** Icon + label + value tile used on detail pages. */
export default function InfoItem({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <div className="info-item">
      <span className="card-icon">
        <Icon name={icon} size={17} />
      </span>
      <div>
        <small>{label}</small>
        <b>{value}</b>
      </div>
    </div>
  );
}
