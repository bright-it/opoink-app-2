<?php
/**
* Copyright 2022 Opoink Framework (http://opoink.com/)
* Licensed under MIT, see LICENSE.md
*/
namespace Opoink\Bmodule\Lib;

class FormValidate {

	/**
	 * \Of\Session\Session
	 */
	protected $_session;

	/**
	 * \Of\Http\Request
	 */
	protected $_request;

	/**
	 * \Of\Std\DataObject
	 */
	protected $_dataObject;

	/**
	 * \Of\Std\Lang
	 */
	protected $_lang;

	public function __construct(
		\Of\Session\Session $Session,
		\Of\Http\Request $Request,
		\Of\Std\DataObject $DataObject,
		\Opoink\Bmodule\Lib\Lang $Lang
	){
		$this->_session = $Session;
		$this->_request = $Request;
		$this->_dataObject = $DataObject;
		$this->_lang = $Lang;
	}

	/**
	 * check if the form is valid.
	 * the form should have form_key and if the form name does not exist
	 * in the session forms then it is invalid request
	 * return the field names with the rules set on it
	 */
	public function validate($formName, $formKey){
		$sesFormKey = $this->_session->getData('form_fields/'.$formName.'/form_key');
		$fields = $this->_session->getData('form_fields/'.$formName.'/fields');
		if($formKey === $sesFormKey){
			return $fields;
		}
	}

	/**
	 * specifically validate the field using the given requirements
	 * 
	 * requirements can be 
	 * 	required: the field should have atleast 1 character long
	 * 	regex: regular expression preg_match will be used to compare
	 * 	email: must be a valid email address
	 * 	min_length: field should be in minimum cahracter long
	 * 	max_length: field should be in maximum cahracter long
	 * 	alpha: should conatin alpha chracters only
	 * 	int: should be a valid whole number
	 * 	decimal: should be a valid decimal number
	 * 	alphanum: alpha numeric character only
	 * 	same: case sensitive, comparison of two input values
	 * 	url: the value should be a valid url link
	 * @param $postField this is the field name comming from the request
	 * return the value from the post if valid, return null if not
	 */
	public function validateField($postField, $rules=null){
		$value = $this->_request->getPost($postField);
		if($value === null){
			$value = '';
		}
		$value = trim($value);

		$formName = $this->_request->getPost('form_builder_form_name');
		if(!$rules){
			$rules = $this->_session->getData('form_fields/'.$formName.'/fields/'.$postField);
		}
		if(is_array($rules)){
			$isRequiredRule = $this->isFieldRequired($rules);
			if($isRequiredRule){
				if(strlen($value) <= 0){
					/**
					 * we have to return the invalid input if it is required and does not have any value
					 */
					return $this->invalidFieldValue($postField, '{{field_name}} is required.', $isRequiredRule, 'field_name');
				}
			}

			foreach ($rules as $key => $rule) {
				if(isset($rule['type'])){
					$rule['type'] = strtolower($rule['type']);
 
					if($rule['type'] == 'email'){
						if (strlen($value) >= 1 && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
							$value = $this->invalidFieldValue($postField, '{{email}} is not a valid email address.', $rule, 'email');
							break;
						}
					}
					else if($rule['type'] == 'min_length' || $rule['type'] == 'max_length'){
						$length = 1;
						if(isset($rule['length'])){
							$length = (int)$rule['length'];
						}
						if(!$length){
							$length = 1;
						}
						$langVars = [
							['key' => '', 'value' => $this->_dataObject->camelCaseToSpace($postField, 'ucwords')],
							['key' => 'length', 'value' => $length],
						];
						if($rule['type'] == 'min_length' && strlen($value) < $length){
							$langVars[0]['key'] = 'min_length';
							$value = $this->invalidFieldValue($postField, 'The {{min_length}} must be a minimum of {{length}} characters long.', $rule, '', $langVars);
							break;
						}
						else if($rule['type'] == 'max_length' && strlen($value) > $length){
							$langVars[0]['key'] = 'max_length';
							$value = $this->invalidFieldValue($postField, 'The {{max_length}} must be a maximum of {{length}} characters long.', $rule, '', $langVars);
							break;
						}
					}
					else if($rule['type'] == 'regex'){
						if(isset($rule['pattern'])){
							if (preg_match($rule['pattern'], $value)) {
								$langVars = [
									['key' => 'value', 'value' => $value],
									['key' => 'field_name', 'value' => $this->_dataObject->camelCaseToSpace($postField, 'ucwords')],
								];
								$value = $this->invalidFieldValue($postField, 'The ({{value}}) is not valid to be a value of the {{field_name}}.', $rule, '', $langVars);
								break;
							}
						}
						else {
							$value = $this->invalidFieldValue($postField, 'The pattern for the {{regex}} field is not set.', $rule, 'regex');
							break;
						}
					}
					else if($rule['type'] == 'alphanum'){
						if (strlen($value) >= 1 && !ctype_alnum($value)) {
							$value = $this->invalidFieldValue($postField, 'The {{alphanum}} must contain alphanumeric characters only.', $rule, 'alphanum');
							break;
						}
					}
					else if($rule['type'] == 'alpha'){
						if (strlen($value) >= 1 && preg_match("/[^a-z]/i", $value)) {
							$value = $this->invalidFieldValue($postField, 'The {{alpha}} must contain alpha characters only.', $rule, 'alpha');
							break;
						}
					}
					else if($rule['type'] == 'int'){
						if (strlen($value) >= 1 && preg_match("/[^0-9]/i", $value)) {
							$value = $this->invalidFieldValue($postField, 'The {{int}} must contain numeric characters only.', $rule, 'int');
							break;
						}
					}
					else if($rule['type'] == 'decimal'){
						if (strlen($value) >= 1 && preg_match("/[^0-9\.]/i", $value)) {
							$value = $this->invalidFieldValue($postField, 'The {{decimal}} must contain a whole number or decimal numbers characters only.', $rule, 'decimal');
							break;
						}
					}
					else if($rule['type'] == 'same'){
						if(isset($rule['reference_input'])){
							$ref = $rule['reference_input'];
							$refInputVal = sha1($this->_request->getPost($ref));
							$compareInputVal = sha1($value);
							
							if(strlen($value) >= 1 && $refInputVal !== $compareInputVal){
								$langVars = [
									['key' => 'ref_input_field', 'value' => $this->_dataObject->camelCaseToSpace($ref, 'ucwords')],
									['key' => 'input_field', 'value' => $this->_dataObject->camelCaseToSpace($postField, 'ucwords')],
								];
								$value = $this->invalidFieldValue($postField, 'The {{input_field}} is not the same with {{ref_input_field}}.', $rule, '', $langVars);
							}
						}
						else {
							$rule['message'] = '';
							$value = $this->invalidFieldValue($postField, 'The {{input_field}} must have reference input.', $rule, 'input_field');
						}
					}
					else if($rule['type'] == 'url'){
						if(strlen($value) >= 1 && !filter_var($value, FILTER_VALIDATE_URL)){
							$value = $this->invalidFieldValue($postField, 'The {{input_field}} is not a valid URL.', $rule, 'input_field');
						}
					}
					else {
						/** do nothing here */
					}
				}
			}
		}

		return $value;
	}

	/**
	 * construct the invalid array for the invalid field
	 * @param string $postField
	 * @param string $defaultMessage
	 * @param array $rule
	 * @param string $strKey
	 * @param array $langVars
	 */
	protected function invalidFieldValue($postField, $defaultMessage, $rule, $strKey='', $langVars=[]){
		if(!count($langVars)){
			$langVars = [
				[
					'key' => $strKey, 
					'value' => $this->_dataObject->camelCaseToSpace($postField, 'ucwords')
				]
			];
		}

		$value = [
			'valid' => false,
			'message' => $this->_lang->_getLang($defaultMessage, $langVars)
		];
		if(isset($rule['message']) && !empty($rule['message'])){
			$value['message'] = $rule['message'];
		}
		return $value;
	}

	/**
	 * check if the given field is required or not
	 * @param array $rules
	 * return boolean false if not required || return array instead 
	 */
	protected function isFieldRequired($rules=[]){
		$isRequired = false;
		foreach ($rules as $key => $rule) {
			$rule['type'] = strtolower($rule['type']);

			if($rule['type'] == 'required'){
				$isRequired = $rule;
				break;
			}
		}
		return $isRequired;
	}
}
?>