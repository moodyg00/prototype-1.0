<?php

require_once __DIR__ . '/../../../php/services/service-estimate-fields.php';
require_once __DIR__ . '/../../../php/services/service-estimate-results.php';
require_once __DIR__ . '/../../../php/support/contact.php';

$estimateFields = get_service_estimate_form_fields((string) $service_type);
$estimateLabel = get_service_estimate_label((string) $service_type);
$estimateFallbackResult = get_service_estimate_fallback_result((string) $service_type);
$estimateModalLabelId = 'estimateModalTitle';
$estimateModalDescriptionId = 'estimateModalDescription';
?>
<div id="estimateModal" class="estimate-modal" hidden>
    <div class="estimate-modal__backdrop" data-estimate-close="true"></div>
    <div class="estimate-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="<?php echo htmlspecialchars($estimateModalLabelId, ENT_QUOTES, 'UTF-8'); ?>" aria-describedby="<?php echo htmlspecialchars($estimateModalDescriptionId, ENT_QUOTES, 'UTF-8'); ?>">
        <section id="form-group" class="service-card estimate-modal__content">
            <div class="estimate-modal__view" data-estimate-view="form">
                <div class="estimate-modal__header">
                    <div>
                        <h1 id="<?php echo htmlspecialchars($estimateModalLabelId, ENT_QUOTES, 'UTF-8'); ?>">Instant Estimate Form</h1>
                        <p id="<?php echo htmlspecialchars($estimateModalDescriptionId, ENT_QUOTES, 'UTF-8'); ?>" class="estimate-invite">Add your project details below for a more accurate estimate.</p>
                    </div>
                    <button type="button" class="estimate-modal__close" aria-label="Close estimate form" data-estimate-close="true">&times;</button>
                </div>

                <form id="serviceEstimateForm" class="estimate-form" novalidate>
                    <input type="hidden" name="service_type" value="<?php echo htmlspecialchars((string) $service_type, ENT_QUOTES, 'UTF-8'); ?>">
                    <input type="hidden" name="service_label" value="<?php echo htmlspecialchars($estimateLabel, ENT_QUOTES, 'UTF-8'); ?>">

                    <div class="estimate-form__grid">
                        <?php foreach ($estimateFields as $field): ?>
                            <?php
                                $fieldName = (string) $field['name'];
                                $fieldId = 'estimate_' . $fieldName;
                                $fieldLabel = (string) $field['label'];
                                $fieldType = (string) $field['type'];
                                $isRequired = !empty($field['required']);
                            ?>
                            <div class="estimate-form__field<?php echo $fieldType === 'textarea' ? ' estimate-form__field--full' : ''; ?>">
                                <?php if ($fieldType === 'checkboxes'): ?>
                                    <p class="estimate-form__group-label"><?php echo htmlspecialchars($fieldLabel, ENT_QUOTES, 'UTF-8'); ?></p>
                                    <div class="estimate-checkbox-group">
                                        <?php foreach ($field['options'] as $index => $option): ?>
                                            <?php $optionId = $fieldId . '_' . $index; ?>
                                            <label for="<?php echo htmlspecialchars($optionId, ENT_QUOTES, 'UTF-8'); ?>">
                                                <input id="<?php echo htmlspecialchars($optionId, ENT_QUOTES, 'UTF-8'); ?>" type="checkbox" name="<?php echo htmlspecialchars($fieldName, ENT_QUOTES, 'UTF-8'); ?>[]" value="<?php echo htmlspecialchars((string) $option, ENT_QUOTES, 'UTF-8'); ?>">
                                                <span><?php echo htmlspecialchars((string) $option, ENT_QUOTES, 'UTF-8'); ?></span>
                                            </label>
                                        <?php endforeach; ?>
                                    </div>
                                <?php else: ?>
                                    <label for="<?php echo htmlspecialchars($fieldId, ENT_QUOTES, 'UTF-8'); ?>"><?php echo htmlspecialchars($fieldLabel, ENT_QUOTES, 'UTF-8'); ?></label>

                                    <?php if ($fieldType === 'select'): ?>
                                        <select id="<?php echo htmlspecialchars($fieldId, ENT_QUOTES, 'UTF-8'); ?>" name="<?php echo htmlspecialchars($fieldName, ENT_QUOTES, 'UTF-8'); ?>"<?php echo $isRequired ? ' required' : ''; ?>>
                                            <option value="">Select...</option>
                                            <?php foreach ($field['options'] as $option): ?>
                                                <option value="<?php echo htmlspecialchars((string) $option, ENT_QUOTES, 'UTF-8'); ?>"><?php echo htmlspecialchars((string) $option, ENT_QUOTES, 'UTF-8'); ?></option>
                                            <?php endforeach; ?>
                                        </select>
                                    <?php elseif ($fieldType === 'textarea'): ?>
                                        <textarea id="<?php echo htmlspecialchars($fieldId, ENT_QUOTES, 'UTF-8'); ?>" name="<?php echo htmlspecialchars($fieldName, ENT_QUOTES, 'UTF-8'); ?>" rows="<?php echo (int) ($field['rows'] ?? 4); ?>"<?php echo $isRequired ? ' required' : ''; ?><?php echo !empty($field['placeholder']) ? ' placeholder="' . htmlspecialchars((string) $field['placeholder'], ENT_QUOTES, 'UTF-8') . '"' : ''; ?>></textarea>
                                    <?php else: ?>
                                        <input id="<?php echo htmlspecialchars($fieldId, ENT_QUOTES, 'UTF-8'); ?>" name="<?php echo htmlspecialchars($fieldName, ENT_QUOTES, 'UTF-8'); ?>" type="<?php echo htmlspecialchars($fieldType, ENT_QUOTES, 'UTF-8'); ?>"<?php echo !empty($field['placeholder']) ? ' placeholder="' . htmlspecialchars((string) $field['placeholder'], ENT_QUOTES, 'UTF-8') . '"' : ''; ?><?php echo isset($field['min']) ? ' min="' . (int) $field['min'] . '"' : ''; ?><?php echo isset($field['default']) ? ' value="' . htmlspecialchars((string) $field['default'], ENT_QUOTES, 'UTF-8') . '"' : ''; ?><?php echo $isRequired ? ' required' : ''; ?>>
                                    <?php endif; ?>
                                <?php endif; ?>
                            </div>
                        <?php endforeach; ?>
                    </div>

                    <div class="estimate-form__field estimate-form__field--full">
                        <label for="estimate_photos">Upload photos</label>
                        <input id="estimate_photos" name="estimate_photos[]" type="file" multiple accept="image/jpeg,image/png,image/webp">
                    </div>

                    <div class="estimate-form__field estimate-form__field--full">
                        <label for="estimate_notes">Additional notes</label>
                        <textarea id="estimate_notes" name="additional_notes" rows="4" placeholder="Share anything else that can help us estimate your project more accurately."></textarea>
                    </div>

                    <div class="estimate-form__actions">
                        <button id="estimateSubmit" type="submit" class="btn">Get Estimate</button>
                        <p id="estimateFormMessage" class="estimate-form__message" hidden></p>
                    </div>
                </form>
            </div>

            <div class="estimate-modal__view estimate-result" data-estimate-view="result" hidden>
                <div class="estimate-modal__header">
                    <div>
                        <h1>Estimate</h1>
                        <p class="estimate-invite">This is the current visual fallback result for <?php echo htmlspecialchars($estimateLabel, ENT_QUOTES, 'UTF-8'); ?>.</p>
                    </div>
                    <button type="button" class="estimate-modal__close" aria-label="Close estimate result" data-estimate-close="true">&times;</button>
                </div>

                <p class="estimate-result__amount"><?php echo htmlspecialchars((string) $estimateFallbackResult['amount'], ENT_QUOTES, 'UTF-8'); ?></p>

                <div class="estimate-result__summary">
                    <?php foreach ($estimateFallbackResult['summary'] as $summaryLine): ?>
                        <p><?php echo htmlspecialchars((string) $summaryLine, ENT_QUOTES, 'UTF-8'); ?></p>
                    <?php endforeach; ?>
                </div>

                <div class="estimate-result__actions">
                    <button type="button" class="estimate-result__edit" data-estimate-reset="true">Edit Form</button>
                    <a class="btn estimate-result__cta" href="<?php echo htmlspecialchars(get_public_booking_sms_href(), ENT_QUOTES, 'UTF-8'); ?>">Text to Book</a>
                    <a class="estimate-result__secondary" href="<?php echo htmlspecialchars(get_public_booking_href(), ENT_QUOTES, 'UTF-8'); ?>">Booking Link</a>
                </div>
            </div>
        </section>
    </div>
</div>
