/** One-time presentation of the existing review controls. No review state here. */
export function installRomusUI(app){
 app.romusUI={review(view){
  if(view.host.dataset.romusReview)return;view.host.dataset.romusReview='true';
  const filters=view.host.querySelector('.ia-fsrs-filters');
  if(filters&&view.counters){const bar=view.host.createDiv({cls:'romus-review-switcher'});view.host.insertBefore(bar,view.counters);bar.append(filters,view.counters)}
  for(const control of view.actions?.querySelectorAll('button')||[]){control.title=control.getAttribute('aria-label')||control.textContent.trim();control.classList.add('romus-review-action')}
 }};
}
